import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";
import { readImageUploadRequest } from "@/libs/imageUploadRequest";
import { uploadImage } from "@/libs/uploadImage";

import {
  createIngredient,
  handleIngredientError,
} from "@/services/ingredient.service";

import { createIngredientSchema } from "@/validations/ingredient.schema";

export const POST = withDB(async (req: Request) => {
  try {
    await requireAdmin();

    const { data: body, image } = await readImageUploadRequest(req);
    const data = createIngredientSchema.parse(body);
    const image_url = image
      ? (await uploadImage(image, "healthybowl/ingredients")).image_url
      : data.image_url;
    const ingredient = await createIngredient({ ...data, image_url });

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
