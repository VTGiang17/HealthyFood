import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";

import { getCategories } from "@/services/category.service";

// GET /api/categories
export const GET = withDB(async () => {
  const categories = await getCategories();

  return NextResponse.json({
    success: true,
    message: "Lấy danh sách danh mục thành công",
    data: categories,
  });
});
