import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import { getUsers, handleUserError } from "@/services/user.service";

import { userQuerySchema } from "@/validations/user.schema";



// GET /api/admin/users
export const GET = withDB(async (req: Request) => {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);

    const query = userQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await getUsers(query);

    return NextResponse.json({
      success: true,
      message: "Lấy danh sách người dùng thành công",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleUserError(error);
  }
});
