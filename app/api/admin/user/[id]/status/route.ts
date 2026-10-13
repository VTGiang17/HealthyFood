import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import { updateUserStatus, handleUserError } from "@/services/user.service";

import { userStatusSchema } from "@/validations/user.schema";

export const runtime = "nodejs";

// PATCH /api/admin/users/:id/status
export const PATCH = withDB<{ id: string }>(async (req, context) => {
  try {
    const admin = await requireAdmin();

    const { id } = await context.params;

    const body = await req.json();
    const data = userStatusSchema.parse(body);

    const user = await updateUserStatus(id, data.status, admin._id.toString());

    return NextResponse.json({
      success: true,
      message: "Cập nhật trạng thái tài khoản thành công",
      data: user,
    });
  } catch (error) {
    return handleUserError(error);
  }
});
