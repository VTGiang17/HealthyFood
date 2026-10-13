import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import {
  getCategoryById,
  updateCategory,
  deleteCategory,
  handleCategoryError,
} from "@/services/category.service";

import { updateCategorySchema } from "@/validations/category.schema";

export const runtime = "nodejs";

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

export const PUT = withDB<{ id: string }>(async (req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await req.json();

    const data = updateCategorySchema.parse(body);

    const category = await updateCategory(id, data);

    return NextResponse.json({
      success: true,
      message: "Cập nhật danh mục thành công",
      data: category,
    });
  } catch (error) {
    return handleCategoryError(error);
  }
});

export const DELETE = withDB<{ id: string }>(async (_req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;

    await deleteCategory(id);

    return NextResponse.json({
      success: true,
      message: "Xóa danh mục thành công",
    });
  } catch (error) {
    return handleCategoryError(error);
  }
});
