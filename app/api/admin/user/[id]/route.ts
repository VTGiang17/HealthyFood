import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import { getUserById, handleUserError } from "@/services/user.service";



// GET /api/admin/users/:id
export const GET = withDB<{ id: string }>(async (_req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const user = await getUserById(id);

    return NextResponse.json({
      success: true,
      message: "Lấy thông tin người dùng thành công",
      data: user,
    });
  } catch (error) {
    return handleUserError(error);
  }
});
