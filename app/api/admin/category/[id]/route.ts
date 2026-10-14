import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";
import { readImageUploadRequest } from "@/libs/imageUploadRequest";
import { uploadImage } from "@/libs/uploadImage";

import {
  updateCategory,
  deleteCategory,
  handleCategoryError,
} from "@/services/category.service";

import { updateCategorySchema } from "@/validations/category.schema";

export const PUT = withDB<{ id: string }>(async (req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const { data: body, image } = await readImageUploadRequest(req);
    const data = updateCategorySchema.parse(body);
    const updateData = image
      ? {
          ...data,
          image_url: (await uploadImage(image, "healthybowl/categories"))
            .image_url,
        }
      : data;
    const category = await updateCategory(id, updateData);

    return NextResponse.json({
      success: true,
      message: "Cập nhật danh mục thành công",
      data: category,
    });
  } catch (error) {
    return handleCategoryError(error);
  }
});

export const DELETE = withDB<{ id: string }>(async (_req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;
    await deleteCategory(id);

    return NextResponse.json({
      success: true,
      message: "Xóa danh mục thành công",
    });
  } catch (error) {
    return handleCategoryError(error);
  }
});
