import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";

import { getMealById, handleMealError } from "@/services/meal.service";

// GET /api/meals/:id
export const GET = withDB<{ id: string }>(async (_req, context) => {
  try {
    const { id } = await context.params;

    const meal = await getMealById(id);

    return NextResponse.json({
      success: true,
      message: "Lấy chi tiết món ăn thành công",
      data: meal,
    });
  } catch (error) {
    return handleMealError(error);
  }
});
