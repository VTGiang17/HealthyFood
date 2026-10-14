import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";
import { readImageUploadRequest } from "@/libs/imageUploadRequest";
import { uploadImage } from "@/libs/uploadImage";

import { createMeal, handleMealError } from "@/services/meal.service";

import { createMealSchema } from "@/validations/meal.schema";

export const POST = withDB(async (req: Request) => {
  try {
    await requireAdmin();

    const { data: body, image } = await readImageUploadRequest(req);
    const data = createMealSchema.parse(body);
    const image_url = image
      ? (await uploadImage(image, "healthybowl/meals")).image_url
      : data.image_url;
    const meal = await createMeal({ ...data, image_url });

    return NextResponse.json(
      {
        success: true,
        message: "Tạo món ăn thành công",
        data: meal,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleMealError(error);
  }
});
