import {
  handleMallAddressCreate,
  handleMallAddressDelete,
  handleMallAddressDetail,
  handleMallAddressList,
  handleMallAddressUpdate,
} from './handlers/mall/address';
import {
  handleMallBagCategory,
  handleMallBagCommentDetail,
  handleMallBagComments,
  handleMallBagDetail,
  handleMallBagList,
  handleMallBagSearch,
  handleMallBanners,
} from './handlers/mall/bag';
import {
  handleBagBoxLock,
  handleBagBoxState,
  handleBagBoxUnlock,
} from './handlers/mall/box';
import {
  handleBagOrderCancel,
  handleBagOrderCreate,
  handleBagOrderDetail,
  handleBagOrderOpen,
  handleBagOrderPay,
  handleBagOrderWechatNotify,
} from './handlers/mall/bag-order';
import {
  handleMallCartAdd,
  handleMallCartDelete,
  handleMallCartUpdate,
  handleMallGetMyItems,
} from './handlers/mall/cart';
import {
  handleMallOrderComment,
  handleMallOrderCreate,
  handleMallOrderDetail,
  handleMallOrderList,
  handleMallOrderPay,
  handleMallOrderUpdate,
  handleMallShipments,
} from './handlers/mall/order';
import {
  handleMallUserProfile,
  handleMallUserProfileUpdate,
} from './handlers/mall/user';
import { ensureArcadeTables } from './arcade/migrate';
import { ensureBagOrderTables } from './bag-order/migrate';
import {
  handleArcadeBoxLock,
  handleArcadeBoxLocks,
  handleArcadeBoxUnlock,
  handleArcadeCabinet,
  handleArcadeCabinetDetail,
  handleArcadeDraw,
  handleArcadeDrawStatus,
  handleArcadeHome,
  handleArcadeMachineDetail,
  handleArcadeMachineList,
} from './handlers/mall/arcade';
import { authWechat, resolveUserId } from './mall-auth';
import { getClientIp } from './arcade/rate-limit';
import { ensureMallTables } from './mall-migrate';
import { mallFail, mallOk } from './mall-response';
import { parseBody, parseQuery } from './response';

/** 前端可能使用的路径别名 */
const PATH_ALIASES: Record<string, string> = {
  list: 'bag/list',
  category: 'bag/category',
  categories: 'bag/category',
  search: 'bag/search',
  'goods/list': 'bag/list',
  'goods/detail': 'bag/detail',
  'goods/categories': 'bag/category',
  'goods/search': 'bag/search',
  'order/list': 'orders',
  'address/list': 'addresses',
};

const PUBLIC_GET_PATHS = new Set([
  'banners',
  'bag/category',
  'bag/list',
  'bag/search',
  'bag/detail',
  'bag/comments',
  'bag/comment/detail',
  'bag/box/state',
]);

function normalizePath(path: string) {
  return PATH_ALIASES[path] || path;
}

function unauthorized() {
  return mallFail('未登录或 token 无效', 401, 401);
}

function notFound(path: string) {
  return mallFail(`接口不存在: ${path}`, 404, 404);
}

function hasError(result: unknown): result is { error: string } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    typeof (result as { error: unknown }).error === 'string'
  );
}

export async function handleMallApi(path: string, request: Request) {
  await ensureMallTables();
  await ensureArcadeTables();
  await ensureBagOrderTables();

  const method = request.method;
  const normalizedPath = normalizePath(path);
  const segments = normalizedPath.split('/').filter(Boolean);
  const params =
    method === 'GET' || method === 'DELETE'
      ? parseQuery(request.url)
      : {};
  const body =
    method === 'GET' || method === 'DELETE'
      ? {}
      : await parseBody(request);

  if (method === 'GET' && PUBLIC_GET_PATHS.has(normalizedPath)) {
    if (normalizedPath === 'banners') {
      return mallOk(await handleMallBanners());
    }
    if (normalizedPath === 'bag/category') {
      return mallOk(await handleMallBagCategory());
    }
    if (normalizedPath === 'bag/list') {
      return mallOk(await handleMallBagList(params));
    }
    if (normalizedPath === 'bag/search') {
      return mallOk(await handleMallBagSearch(params));
    }
    if (normalizedPath === 'bag/detail') {
      const detail = await handleMallBagDetail(params);
      if (!detail) return mallFail('商品不存在', 404, 404);
      return mallOk(detail);
    }
    if (normalizedPath === 'bag/comments') {
      return mallOk(await handleMallBagComments(params));
    }
    if (normalizedPath === 'bag/comment/detail') {
      const comment = await handleMallBagCommentDetail(params);
      if (!comment) return mallFail('评论不存在', 404, 404);
      return mallOk(comment);
    }
    if (normalizedPath === 'bag/box/state') {
      const result = await handleBagBoxState(params);
      if ('code' in result && result.code) {
        return mallFail(result.message, result.code);
      }
      return mallOk(result.state);
    }
  }

  if (method === 'GET' && normalizedPath === 'arcade/home') {
    return mallOk(await handleArcadeHome());
  }
  if (method === 'GET' && normalizedPath === 'arcade/machines') {
    return mallOk(await handleArcadeMachineList(params));
  }
  if (segments[0] === 'arcade' && segments[1] === 'machines' && segments.length === 3 && method === 'GET') {
    const detail = await handleArcadeMachineDetail(segments[2]);
    if (!detail) return mallFail('抽盒机不存在', 404, 404);
    return mallOk(detail);
  }
  if (segments[0] === 'arcade' && segments[1] === 'machines' && segments.length === 4 && segments[3] === 'locks' && method === 'GET') {
    return mallOk(await handleArcadeBoxLocks(segments[2]));
  }

  if (normalizedPath === 'user/auth_wechat' && method === 'POST') {
    const result = await authWechat(body);
    if (!result) return mallFail('登录失败：缺少 code');
    return mallOk(result);
  }

  if (normalizedPath === 'bag/order/wechat/notify' && method === 'POST') {
    const result = await handleBagOrderWechatNotify(body);
    if ('code' in result && !('ok' in result)) {
      return mallFail(result.message, result.code ?? 1);
    }
    return mallOk({ received: true });
  }

  const userId = resolveUserId(request, params, body);

  if (normalizedPath === 'getMyItems' && method === 'GET') {
    if (!userId) return mallOk({ items: [], total: 0, checkedCount: 0 });
    return mallOk(await handleMallGetMyItems(userId));
  }

  if (!userId) return unauthorized();

  const clientIp = getClientIp(request);

  if (normalizedPath === 'bag/box/lock' && method === 'POST') {
    const result = await handleBagBoxLock(userId, request, body);
    if ('code' in result && !('state' in result)) {
      const httpStatus =
        'httpStatus' in result && typeof result.httpStatus === 'number'
          ? result.httpStatus
          : 200;
      return mallFail(result.message, result.code, httpStatus);
    }
    return mallOk(result.state);
  }
  if (normalizedPath === 'bag/box/unlock' && method === 'POST') {
    const result = await handleBagBoxUnlock(userId, body);
    if ('code' in result && !('state' in result)) {
      const httpStatus =
        'httpStatus' in result && typeof result.httpStatus === 'number'
          ? result.httpStatus
          : 200;
      return mallFail(result.message, result.code, httpStatus);
    }
    return mallOk(result.state);
  }

  if (normalizedPath === 'bag/order/create' && method === 'POST') {
    const result = await handleBagOrderCreate(userId, body);
    if ('code' in result && !('order' in result)) {
      return mallFail(result.message, result.code);
    }
    return mallOk(result.order);
  }

  if (segments[0] === 'bag' && segments[1] === 'order' && segments.length === 3) {
    const orderId = segments[2];
    if (method === 'GET') {
      const order = await handleBagOrderDetail(userId, orderId);
      if (!order) return mallFail('订单不存在', 404, 404);
      return mallOk(order);
    }
  }

  if (segments[0] === 'bag' && segments[1] === 'order' && segments.length === 4) {
    const orderId = segments[2];
    const action = segments[3];
    if (action === 'pay' && method === 'POST') {
      const result = await handleBagOrderPay(userId, orderId);
      if ('code' in result && !('payParams' in result)) {
        return mallFail(result.message || '支付失败', result.code ?? 1);
      }
      return mallOk(result.payParams);
    }
    if (action === 'cancel' && method === 'POST') {
      const result = await handleBagOrderCancel(userId, orderId);
      if ('code' in result && !('order' in result)) {
        return mallFail(result.message || '取消失败', result.code ?? 1);
      }
      return mallOk(result.order);
    }
    if (action === 'open' && method === 'POST') {
      const result = await handleBagOrderOpen(userId, orderId);
      if ('code' in result && !('result' in result)) {
        return mallFail(result.message || '开赏失败', result.code ?? 1);
      }
      return mallOk(result.result);
    }
  }

  if (normalizedPath === 'arcade/draw' && method === 'POST') {
    const result = await handleArcadeDraw(userId, clientIp, body);
    if (hasError(result)) return mallFail(result.error);
    return mallOk(result);
  }
  if (normalizedPath === 'arcade/box/lock' && method === 'POST') {
    const result = await handleArcadeBoxLock(userId, clientIp, body);
    if (hasError(result)) return mallFail(result.error);
    return mallOk(result);
  }
  if (normalizedPath === 'arcade/box/unlock' && method === 'POST') {
    const result = await handleArcadeBoxUnlock(userId, body);
    if (hasError(result)) return mallFail(result.error);
    return mallOk(result);
  }
  if (normalizedPath === 'arcade/cabinet' && method === 'GET') {
    return mallOk(await handleArcadeCabinet(userId, params));
  }
  if (segments[0] === 'arcade' && segments[1] === 'draw' && segments[2] === 'status' && method === 'GET') {
    const jobId = params.jobId || '';
    const status = await handleArcadeDrawStatus(jobId, userId);
    if (!status) return mallFail('任务不存在', 404, 404);
    return mallOk(status);
  }
  if (segments[0] === 'arcade' && segments[1] === 'cabinet' && segments.length === 3 && method === 'GET') {
    const detail = await handleArcadeCabinetDetail(userId, segments[2]);
    if (!detail) return mallFail('奖品不存在', 404, 404);
    return mallOk(detail);
  }

  if (normalizedPath === 'cart/add' && method === 'POST') {
    const result = await handleMallCartAdd(userId, body);
    if (hasError(result)) return mallFail(result.error);
    return mallOk(result);
  }
  if (normalizedPath === 'cart/update' && method === 'POST') {
    const result = await handleMallCartUpdate(userId, body);
    if (hasError(result)) return mallFail(result.error);
    return mallOk(result);
  }
  if (normalizedPath === 'cart/delete' && method === 'POST') {
    const result = await handleMallCartDelete(userId, body);
    if (hasError(result)) return mallFail(result.error);
    return mallOk(result);
  }
  if (normalizedPath === 'user/profile') {
    if (method === 'GET') {
      const profile = await handleMallUserProfile(userId);
      if (!profile) return mallFail('用户不存在', 404, 404);
      return mallOk(profile);
    }
    if (method === 'PUT') {
      const result = await handleMallUserProfileUpdate(userId, body);
      if (hasError(result)) return mallFail(result.error);
      return mallOk(result);
    }
  }
  if (normalizedPath === 'addresses' && method === 'GET') {
    return mallOk(await handleMallAddressList(userId));
  }
  if (normalizedPath === 'addresses' && method === 'POST') {
    return mallOk(await handleMallAddressCreate(userId, body));
  }
  if (normalizedPath === 'shipments' && method === 'GET') {
    return mallOk(await handleMallShipments(userId, params));
  }
  if (normalizedPath === 'orders' && method === 'GET') {
    return mallOk(await handleMallOrderList(userId, params));
  }
  if (normalizedPath === 'orders' && method === 'POST') {
    const result = await handleMallOrderCreate(userId, body);
    if (hasError(result)) return mallFail(result.error);
    return mallOk(result);
  }

  if (segments[0] === 'orders' && segments.length >= 2) {
    const orderId = segments[1];
    if (segments.length === 2) {
      if (method === 'GET') {
        const detail = await handleMallOrderDetail(userId, orderId);
        if (!detail) return mallFail('订单不存在', 404, 404);
        return mallOk(detail);
      }
      if (method === 'PUT') {
        const result = await handleMallOrderUpdate(userId, orderId, body);
        if (hasError(result)) return mallFail(result.error);
        return mallOk(result);
      }
    }
    if (segments[2] === 'comment' && method === 'POST') {
      const result = await handleMallOrderComment(userId, orderId, body);
      if (hasError(result)) return mallFail(result.error);
      return mallOk(result);
    }
    if (segments[2] === 'pay' && method === 'POST') {
      const result = await handleMallOrderPay(userId, orderId);
      if (hasError(result)) return mallFail(result.error);
      return mallOk(result);
    }
  }

  if (segments[0] === 'addresses' && segments.length === 2) {
    const addressId = segments[1];
    if (method === 'GET') {
      const detail = await handleMallAddressDetail(userId, addressId);
      if (!detail) return mallFail('地址不存在', 404, 404);
      return mallOk(detail);
    }
    if (method === 'PUT') {
      const result = await handleMallAddressUpdate(userId, addressId, body);
      if (hasError(result)) return mallFail(result.error);
      return mallOk(result);
    }
    if (method === 'DELETE') {
      const result = await handleMallAddressDelete(userId, addressId);
      if (hasError(result)) return mallFail(result.error);
      return mallOk(result);
    }
  }

  return notFound(path);
}
