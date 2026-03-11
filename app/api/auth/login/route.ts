import { NextRequest } from "next/server";
import { ApiResponder } from "@/lib/api/response";
import { loginSchema } from "@/lib/schemas/auth";
import { AuthService } from "@/services/authService";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. 输入验证
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return ApiResponder.error(
        result.error.issues[0].message,
        400,
        result.error.flatten()
      );
    }

    // 2. 调用 Service 进行登录
    const token = await AuthService.login(result.data);

    if (token) {
      const response = ApiResponder.success(null, "登录成功");

      // 3. 将 Token 存入 HttpOnly Cookie
      response.cookies.set({
        name: "auth-token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 小时
        path: "/",
      });

      logger.info(
        { user: result.data.username },
        "User logged in successfully"
      );
      return response;
    }

    logger.warn(
      { user: result.data.username },
      "Login failed: Invalid credentials"
    );
    return ApiResponder.unauthorized("账号或密码错误");
  } catch (error) {
    logger.error({ err: error }, "Login API error");
    return ApiResponder.serverError("服务器错误");
  }
}
