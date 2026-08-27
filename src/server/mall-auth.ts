import { v4 as uuidv4 } from 'uuid';
import { query } from './db';
import { newId } from './response';

const userTokenStore = new Map<string, string>();

export function createUserToken(userId: string) {
  const token = uuidv4();
  userTokenStore.set(token, userId);
  return token;
}

function getUserIdFromToken(request: Request): string | null {
  const auth =
    request.headers.get('authorization') ||
    request.headers.get('Authorization');
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return userTokenStore.get(token) || null;
}

/** 支持 Authorization Bearer 或 query/body 中的 userId */
export function resolveUserId(
  request: Request,
  params: Record<string, string> = {},
  body: Record<string, unknown> = {},
): string | null {
  const fromToken = getUserIdFromToken(request);
  if (fromToken) return fromToken;

  const userId = String(params.userId || body.userId || '').trim();
  return userId || null;
}

export function getUserIdFromRequest(request: Request): string | null {
  return getUserIdFromToken(request);
}

export async function authWechat(body: Record<string, unknown>) {
  const code = String(body.code || '');
  if (!code) return null;

  const openid = `wx_${code}`;
  const existing = await query('SELECT id FROM app_user WHERE openid = $1', [
    openid,
  ]);
  let userId: string;
  if (existing.rowCount) {
    userId = String(existing.rows[0].id);
    await query(
      `UPDATE app_user SET nickname = COALESCE(NULLIF($2, ''), nickname),
       avatar = COALESCE(NULLIF($3, ''), avatar), updated_at = NOW() WHERE id = $1`,
      [userId, body.nickname || '', body.avatar || ''],
    );
  } else {
    userId = newId('user');
    await query(
      `INSERT INTO app_user (id, openid, nickname, avatar, user_group_name)
       VALUES ($1, $2, $3, $4, '普通用户')`,
      [userId, openid, body.nickname || '微信用户', body.avatar || ''],
    );
  }
  const token = createUserToken(userId);
  return { token, userId };
}
