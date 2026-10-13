import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import {
  getCategories,
  createCategory,
  handleCategoryError,
} from "@/services/category.service";

import { createCategorySchema } from "@/validations/category.schema";

export const runtime = "nodejs";

// GET /api/categories
export const GET = withDB(async () => {
  const categories = await getCategories();

  return NextResponse.json({
    success: true,
    message: "Lấy danh sách danh mục thành công",
    data: categories,
  });
});

// POST /api/categories
export const POST = withDB(async (req: Request) => {
  try {
    await requireAdmin();

    const body = await req.json();
    const data = createCategorySchema.parse(body);

    const category = await createCategory(data);

    return NextResponse.json(
      {
        success: true,
        message: "Thêm danh mục thành công",
        data: category,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleCategoryError(error);
  }
});
