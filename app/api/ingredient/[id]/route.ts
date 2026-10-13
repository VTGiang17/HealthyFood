import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import {
  getIngredientById,
  updateIngredient,
  deleteIngredient,
  handleIngredientError,
} from "@/services/ingredient.service";

import { updateIngredientSchema } from "@/validations/ingredient.schema";

export const runtime = "nodejs";

export const GET = withDB<{ id: string }>(async (_req, context) => {
  try {
    const { id } = await context.params;
    const ingredient = await getIngredientById(id);

    return NextResponse.json({
      success: true,
      data: ingredient,
    });
  } catch (error) {
    return handleIngredientError(error);
  }
});

export const PUT = withDB<{ id: string }>(async (req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await req.json();

    const data = updateIngredientSchema.parse(body);
    const ingredient = await updateIngredient(id, data);

    return NextResponse.json({
      success: true,
      message: "Cập nhật nguyên liệu thành công",
      data: ingredient,
    });
  } catch (error) {
    return handleIngredientError(error);
  }
});

export const DELETE = withDB<{ id: string }>(async (_req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;
    await deleteIngredient(id);

    return NextResponse.json({
      success: true,
      message: "Ẩn nguyên liệu thành công",
    });
  } catch (error) {
    return handleIngredientError(error);
  }
});
