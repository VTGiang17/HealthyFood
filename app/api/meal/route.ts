import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import { getMeals, createMeal, handleMealError } from "@/services/meal.service";

import { createMealSchema } from "@/validations/meal.schema";

export const runtime = "nodejs";

// GET /api/meals
// GET /api/meals?recommended=true
// GET /api/meals?recommended=false
export const GET = withDB(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);

    const recommended = searchParams.get("recommended");

    if (
      recommended !== null &&
      recommended !== "true" &&
      recommended !== "false"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tham số recommended không hợp lệ",
        },
        { status: 400 }
      );
    }

    const isRecommended =
      recommended === null ? undefined : recommended === "true";

    const meals = await getMeals(isRecommended);

    return NextResponse.json({
      success: true,
      message: "Lấy danh sách món ăn thành công",
      data: meals,
    });
  } catch (error) {
    return handleMealError(error);
  }
});

// POST /api/meals
export const POST = withDB(async (req: Request) => {
  try {
    await requireAdmin();

    const body = await req.json();
    const data = createMealSchema.parse(body);

    const meal = await createMeal(data);

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
