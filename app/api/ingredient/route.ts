import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import {
  getIngredients,
  createIngredient,
  handleIngredientError,
} from "@/services/ingredient.service";

import { createIngredientSchema } from "@/validations/ingredient.schema";

export const runtime = "nodejs";

export const GET = withDB(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);

    const ingredients = await getIngredients({
      categoryId: searchParams.get("categoryId") || undefined,
      search: searchParams.get("search") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Lấy danh sách nguyên liệu thành công",
      data: ingredients,
    });
  } catch (error) {
    return handleIngredientError(error);
  }
});

export const POST = withDB(async (req: Request) => {
  try {
    await requireAdmin();

    const body = await req.json();
    const data = createIngredientSchema.parse(body);

    const ingredient = await createIngredient(data);

    return NextResponse.json(
      {
        success: true,
        message: "Thêm nguyên liệu thành công",
        data: ingredient,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleIngredientError(error);
  }
});
