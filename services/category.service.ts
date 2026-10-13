import "server-only";
import mongoose from "mongoose";

import Category from "@/models/Category";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthorizationError } from "@/libs/authorization";

import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/validations/category.schema";

export class CategoryError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}

export const getCategories = async () => {
  return Category.find().sort({ createdAt: -1 }).lean();
};

export const getCategoryById = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new CategoryError("ID danh mục không hợp lệ", 400);
  }

  const category = await Category.findById(id).lean();

  if (!category) {
    throw new CategoryError("Không tìm thấy danh mục", 404);
  }

  return category;
};

export const createCategory = async (data: CreateCategoryInput) => {
  const existingCategory = await Category.findOne({
    name: data.name,
  });

  if (existingCategory) {
    throw new CategoryError("Tên danh mục đã tồn tại", 409);
  }

  try {
    return await Category.create(data);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new CategoryError("Tên danh mục đã tồn tại", 409);
    }

    throw error;
  }
};

export const updateCategory = async (id: string, data: UpdateCategoryInput) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new CategoryError("ID danh mục không hợp lệ", 400);
  }

  try {
    const category = await Category.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      throw new CategoryError("Không tìm thấy danh mục", 404);
    }

    return category;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new CategoryError("Tên danh mục đã tồn tại", 409);
    }

    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new CategoryError("ID danh mục không hợp lệ", 400);
  }

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new CategoryError("Không tìm thấy danh mục", 404);
  }

  return category;
};

export const handleCategoryError = (error: unknown) => {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: error.issues,
      },
      { status: 400 }
    );
  }

  if (error instanceof CategoryError || error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.statusCode }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Lỗi máy chủ" },
    { status: 500 }
  );
};
