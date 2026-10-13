import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { register } from "@/services/auth.service";
import { registerSchema } from "@/validations/auth.schema";
import { handleAuthError } from "@/services/auth-error";

export const runtime = "nodejs";

export const POST = withDB(async (req: Request) => {
  try {
    const body = await req.json();

    const data = registerSchema.parse(body);

    const user = await register(data);

    return NextResponse.json(
      {
        success: true,
        message: "Đăng ký thành công",
        data: user,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
});
