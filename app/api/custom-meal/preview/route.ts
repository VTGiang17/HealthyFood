import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";

import {
  previewCustomMeal,
  handleCustomMealError,
} from "@/services/customMeal.service";

import { customMealSchema } from "@/validations/customMeal.schema";



export const POST = withDB(async (req: Request) => {
  try {
    const body = await req.json();

    const data = customMealSchema.parse(body);

    const result = await previewCustomMeal(data);

    return NextResponse.json({
      success: true,
      message: "Tính toán phần cơm thành công",
      data: result,
    });
  } catch (error) {
    return handleCustomMealError(error);
  }
});
