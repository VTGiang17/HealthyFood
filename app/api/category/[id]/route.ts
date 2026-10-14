import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";

import { getCategoryById, handleCategoryError } from "@/services/category.service";

export const GET = withDB<{ id: string }>(async (_req, context) => {
  try {
    const { id } = await context.params;

    const category = await getCategoryById(id);

    return NextResponse.json({
      success: true,
      message: "Lấy chi tiết danh mục thành công",
      data: category,
    });
  } catch (error) {
    return handleCategoryError(error);
  }
});
