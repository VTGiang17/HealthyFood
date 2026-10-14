import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";
import { readImageUploadRequest } from "@/libs/imageUploadRequest";
import { uploadImage } from "@/libs/uploadImage";

import {
  updateMeal,
  deleteMeal,
  handleMealError,
} from "@/services/meal.service";

import { updateMealSchema } from "@/validations/meal.schema";

export const PUT = withDB<{ id: string }>(async (req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const { data: body, image } = await readImageUploadRequest(req);
    const data = updateMealSchema.parse(body);
    const updateData = image
      ? {
          ...data,
          image_url: (await uploadImage(image, "healthybowl/meals")).image_url,
        }
      : data;
    const meal = await updateMeal(id, updateData);

    return NextResponse.json({
      success: true,
      message: "Cập nhật món ăn thành công",
      data: meal,
    });
  } catch (error) {
    return handleMealError(error);
  }
});

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
