import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";

import { getMeals, handleMealError } from "@/services/meal.service";

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
