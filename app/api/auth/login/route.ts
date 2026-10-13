import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { generateAccessToken } from "@/libs/auth";
import { login } from "@/services/auth.service";
import { loginSchema } from "@/validations/auth.schema";
import { handleAuthError } from "@/services/auth-error";

export const runtime = "nodejs";

export const POST = withDB(async (req: Request) => {
  try {
    const body = await req.json();

    const data = loginSchema.parse(body);

    const user = await login(data);

    const token = await generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công",
      data: user,
    });

    response.cookies.set("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return handleAuthError(error);
  }
});
