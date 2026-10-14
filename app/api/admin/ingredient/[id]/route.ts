import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";
import { readImageUploadRequest } from "@/libs/imageUploadRequest";
import { uploadImage } from "@/libs/uploadImage";

import {
  updateIngredient,
  deleteIngredient,
  handleIngredientError,
} from "@/services/ingredient.service";

import { updateIngredientSchema } from "@/validations/ingredient.schema";

export const PUT = withDB<{ id: string }>(async (req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const { data: body, image } = await readImageUploadRequest(req);
    const data = updateIngredientSchema.parse(body);
    const updateData = image
      ? {
          ...data,
          image_url: (await uploadImage(image, "healthybowl/ingredients"))
            .image_url,
        }
      : data;
    const ingredient = await updateIngredient(id, updateData);

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
