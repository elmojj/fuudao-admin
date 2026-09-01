import { createHmac, timingSafeEqual } from 'crypto';
import { query } from './db';
import { newId } from './response';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getTokenSecret(): string {
  const secret = process.env.TOKEN_SECRET?.trim();
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('TOKEN_SECRET is required in production');
  }
  return secret || 'dev-only-token-secret';
}

function signPayload(payload: string): string {
  return createHmac('sha256', getTokenSecret())
    .update(payload)
    .digest('base64url');
}

export function createUserToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + TOKEN_TTL_MS }),
  ).toString('base64url');
  return `${payload}.${signPayload(payload)}`;
}

export function getUserIdFromAuthorization(
  authHeader: string | undefined | null,
): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = signPayload(payload);

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expBuf.length ||
      !timingSafeEqual(sigBuf, expBuf)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { userId?: string; exp?: number };
    if (!data.userId || !data.exp || data.exp < Date.now()) return null;
    return data.userId;
  } catch {
    return null;
  }
}

function getUserIdFromToken(request: Request): string | null {
  const auth =
    request.headers.get('authorization') ||
    request.headers.get('Authorization');
  return getUserIdFromAuthorization(auth);
}

/** 支持 Authorization Bearer；开发环境可回退 query/body userId */
export function resolveUserId(
  request: Request,
  params: Record<string, string> = {},
  body: Record<string, unknown> = {},
): string | null {
  const fromToken = getUserIdFromToken(request);
  if (fromToken) return fromToken;

  if (process.env.NODE_ENV === 'production') return null;

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
