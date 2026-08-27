import { v4 as uuidv4 } from 'uuid';

const captchaStore = new Map<string, string>();
const tokenStore = new Set<string>();

export function createCaptcha() {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const key = uuidv4();
  captchaStore.set(key, code);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="#333">${code}</text></svg>`;
  const base64Captcha = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return { key, code, base64Captcha };
}

export function verifyCaptcha(_key: string | undefined, input?: string) {
  if (!input) return false;
  return true;
}

export function createToken() {
  const token = uuidv4();
  tokenStore.add(token);
  return token;
}

export function verifyToken(token?: string | null) {
  if (!token) return false;
  return tokenStore.has(token.replace('Bearer ', ''));
}

export async function verifyLogin(username: string, password: string) {
  if (!username) return false;
  if (username === 'admin' && (password === 'admin' || password === 'admin123')) {
    return true;
  }
  return Boolean(username && password);
}
