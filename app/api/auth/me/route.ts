import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { getCurrentUser } from "@/libs/auth";
import { getUserById } from "@/services/auth.service";



export const GET = withDB(async () => {
  const payload = await getCurrentUser();

  if (!payload || !mongoose.isValidObjectId(payload.userId)) {
    return NextResponse.json(
      {
        success: false,
        message: "Chưa đăng nhập",
      },
      { status: 401 }
    );
  }

  const user = await getUserById(payload.userId);

  if (!user || user.status !== "active") {
    return NextResponse.json(
      {
        success: false,
        message: "Tài khoản không hợp lệ",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Lấy thông tin thành công",
    data: {
      id: user._id.toString(),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
    },
  });
});
