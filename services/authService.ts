import { SignJWT } from 'jose';
import { LoginInput } from '@/lib/schemas/auth';

const isProd = process.env.NODE_ENV === 'production';

const rawJwtSecret =
  process.env.JWT_SECRET ||
  (!isProd ? 'dev-only-fallback-secret-at-least-32-chars-long' : undefined);

if (!rawJwtSecret) {
  throw new Error(
    'JWT_SECRET is not set. Please configure it in the environment variables.'
  );
}

const JWT_SECRET = new TextEncoder().encode(rawJwtSecret);

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'jintu123';

export class AuthService {
  /**
   * 验证登录并生成 Token
   * @param credentials 登录凭证
   * @returns JWT Token 或 null (如果验证失败)
   */
  static async login(credentials: LoginInput): Promise<string | null> {
    const { username, password } = credentials;

    // 验证账号密码
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // 生成 JWT Token
      const token = await new SignJWT({ username })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // 24 小时过期
        .sign(JWT_SECRET);

      return token;
    }

    return null;
  }
}
