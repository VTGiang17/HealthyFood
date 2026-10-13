import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import { updateUserRole, handleUserError } from "@/services/user.service";

import { userRoleSchema } from "@/validations/user.schema";

export const runtime = "nodejs";

// PATCH /api/admin/users/:id/role
export const PATCH = withDB<{ id: string }>(async (req, context) => {
  try {
    const admin = await requireAdmin();

    const { id } = await context.params;

    const body = await req.json();
    const data = userRoleSchema.parse(body);

    const user = await updateUserRole(id, data.role, admin._id.toString());

    return NextResponse.json({
      success: true,
      message: "Cập nhật quyền người dùng thành công",
      data: user,
    });
  } catch (error) {
    return handleUserError(error);
  }
});
