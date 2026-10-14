import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";
import { readImageUploadRequest } from "@/libs/imageUploadRequest";
import { uploadImage } from "@/libs/uploadImage";

import {
  createCategory,
  handleCategoryError,
} from "@/services/category.service";

import { createCategorySchema } from "@/validations/category.schema";

export const POST = withDB(async (req: Request) => {
  try {
    await requireAdmin();

    const { data: body, image } = await readImageUploadRequest(req);
    const data = createCategorySchema.parse(body);
    const image_url = image
      ? (await uploadImage(image, "healthybowl/categories")).image_url
      : data.image_url;
    const category = await createCategory({ ...data, image_url });

    return NextResponse.json(
      {
        success: true,
        message: "Thêm danh mục thành công",
        data: category,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleCategoryError(error);
  }
});
