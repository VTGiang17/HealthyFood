import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import {
  getMealById,
  updateMeal,
  deleteMeal,
  handleMealError,
} from "@/services/meal.service";

import { updateMealSchema } from "@/validations/meal.schema";

export const runtime = "nodejs";

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

// PUT /api/meals/:id
export const PUT = withDB<{ id: string }>(async (req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await req.json();

    const data = updateMealSchema.parse(body);

    const meal = await updateMeal(id, data);

    return NextResponse.json({
      success: true,
      message: "Cập nhật món ăn thành công",
      data: meal,
    });
  } catch (error) {
    return handleMealError(error);
  }
});

// DELETE /api/meals/:id
export const DELETE = withDB<{ id: string }>(async (_req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;

    await deleteMeal(id);

    return NextResponse.json({
      success: true,
      message: "Ẩn món ăn thành công",
    });
  } catch (error) {
    return handleMealError(error);
  }
});
