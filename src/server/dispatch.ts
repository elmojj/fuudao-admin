import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { createCaptcha, createToken, verifyLogin } from './auth';
import {
  handleBagCategoryCreateOrUpdate,
  handleBagCategoryList,
  handleBagCreateOrUpdate,
  handleBagList,
  handleItemBatchCreateOrUpdate,
  handleItemCreateOrUpdate,
  handleItemDelete,
  handleItemList,
} from './handlers/bag';
import {
  handleBagBoxStateAdmin,
  handleDashboardStats,
  handleGachaChanceGrant,
  handleGachaChanceLogList,
  handleGachaDrawLogList,
  handleGachaItemCreateOrUpdate,
  handleGachaItemDelete,
  handleGachaItemList,
  handleGachaPoolCreateOrUpdate,
  handleGachaPoolList,
  handleGachaRankSnapshotList,
  handleGachaScoreGrant,
  handleGachaScoreLogList,
  handleUserCollectionList,
} from './handlers/gacha-admin';
import {
  handleLogisticsBatchDelivery,
  handleLogisticsBatchSign,
  handleLogisticsDelivery,
  handleLogisticsExport,
  handleLogisticsList,
  handleLogisticsUpdate,
} from './handlers/logistics';
import {
  handleOrderBatchCreateLogistics,
  handleOrderCreateOrUpdate,
  handleOrderList,
  handleUserGet,
  handleUserList,
} from './handlers/order-user';
import {
  handleItemLevelCreateOrUpdate,
  handleItemLevelDelete,
  handleItemLevelList,
  handleStockpileCreateOrUpdate,
  handleStockpileList,
} from './handlers/stockpile';
import { fail, ok, parseBody, parseQuery, portalOk } from './response';

export async function handleFeaturesV1(path: string, request: Request) {
  const body =
    request.method === 'GET' ? parseQuery(request.url) : await parseBody(request);

  switch (path) {
    case 'bag/list':
      return ok(await handleBagList(body));
    case 'bag/createOrUpdate':
      return ok(await handleBagCreateOrUpdate(body));
    case 'bag_category/list':
      return ok(await handleBagCategoryList(body));
    case 'bag_category/createOrUpdate':
      return ok(await handleBagCategoryCreateOrUpdate(body));
    case 'item/list':
      return ok(await handleItemList(body));
    case 'item/createOrUpdate':
      return ok(await handleItemCreateOrUpdate(body));
    case 'item/batchCreateOrUpdate':
      return ok(await handleItemBatchCreateOrUpdate(body));
    case 'item/delete':
      return ok(await handleItemDelete(body));
    case 'item_level/list':
      return ok(await handleItemLevelList(body));
    case 'item_level/createOrUpdate':
      return ok(await handleItemLevelCreateOrUpdate(body));
    case 'item_level/delete':
      return ok(await handleItemLevelDelete(body));
    case 'order/list':
      return ok(await handleOrderList(body));
    case 'order/createOrUpdate':
      return ok(await handleOrderCreateOrUpdate(body));
    case 'order/batch_create_logistics':
      return ok(await handleOrderBatchCreateLogistics(body));
    case 'logistics/list':
      return ok(await handleLogisticsList(body));
    case 'logistics/update':
      return ok(await handleLogisticsUpdate(body));
    case 'logistics/batch_delivery':
      return ok(await handleLogisticsBatchDelivery(body));
    case 'logistics/batch_sign':
      return ok(await handleLogisticsBatchSign(body));
    case 'logistics/export':
      return handleLogisticsExport();
    case 'logistics/delivery':
      return ok(await handleLogisticsDelivery());
    case 'user/list':
      return ok(await handleUserList(body));
    case 'user/get':
      return ok(await handleUserGet(body));
    case 'dashboard/stats':
      return ok(await handleDashboardStats());
    case 'gacha_pool/list':
      return ok(await handleGachaPoolList(body));
    case 'gacha_pool/createOrUpdate':
      return ok(await handleGachaPoolCreateOrUpdate(body));
    case 'gacha_item/list':
      return ok(await handleGachaItemList(body));
    case 'gacha_item/createOrUpdate':
      return ok(await handleGachaItemCreateOrUpdate(body));
    case 'gacha_item/delete':
      return ok(await handleGachaItemDelete(body));
    case 'gacha_draw_log/list':
      return ok(await handleGachaDrawLogList(body));
    case 'gacha_chance_log/list':
      return ok(await handleGachaChanceLogList(body));
    case 'gacha_score_log/list':
      return ok(await handleGachaScoreLogList(body));
    case 'gacha_rank_snapshot/list':
      return ok(await handleGachaRankSnapshotList(body));
    case 'gacha_chance/grant':
      return ok(await handleGachaChanceGrant(body));
    case 'gacha_score/grant':
      return ok(await handleGachaScoreGrant(body));
    case 'user/collection/list':
      return ok(await handleUserCollectionList(body));
    case 'bag/box/state':
      return ok(await handleBagBoxStateAdmin(body));
    default:
      return fail(`Unknown features API: ${path}`);
  }
}

export async function handleV1(path: string, request: Request) {
  if (path === 'stockpile/list' && request.method === 'GET') {
    return ok(await handleStockpileList(parseQuery(request.url)));
  }
  if (path === 'stockpile/createOrUpdate' && request.method === 'POST') {
    return ok(await handleStockpileCreateOrUpdate(await parseBody(request)));
  }
  return fail(`Unknown v1 API: ${path}`);
}

export async function handleSystemUser(action: string, request: Request) {
  if (action === 'login' && request.method === 'POST') {
    const body = await parseBody<{
      username: string;
      password: string;
      code?: string;
    }>(request);
    const validUser = await verifyLogin(body.username, body.password);
    if (!validUser) return fail('用户名或密码错误', 401);
    return ok({ token: createToken() });
  }
  if (action === 'getCaptcha') {
    const captcha = createCaptcha();
    return ok({
      base64Captcha: captcha.base64Captcha,
      content: captcha.code,
    });
  }
  return fail(`Unknown system API: ${action}`);
}

export async function handlePortal(action: string, request: Request) {
  if (action === 'pingLogin') {
    return portalOk();
  }
  if (action === 'getUserConfigValues') {
    return portalOk({
      configs: {
        themeColorVars: 'light',
        historySearchWord: '[]',
      },
    });
  }
  if (action === 'setUserConfigValue') {
    return portalOk();
  }
  return fail(`Unknown portal API: ${action}`);
}

export async function handleLogout() {
  return portalOk();
}

export async function handleFileUpload(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return fail('未找到上传文件');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file instanceof File && file.name.includes('.')
    ? file.name.split('.').pop()
    : 'png';
  const filename = `upload_${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  const origin = request.headers.get('origin') || 'http://localhost:3000';
  const url = `${origin}/uploads/${filename}`;
  return ok(url);
}
