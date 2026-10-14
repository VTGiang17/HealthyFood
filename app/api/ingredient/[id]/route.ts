import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";

import { getIngredientById, handleIngredientError } from "@/services/ingredient.service";

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
