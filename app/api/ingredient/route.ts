import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";

import { getIngredients, handleIngredientError } from "@/services/ingredient.service";

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
