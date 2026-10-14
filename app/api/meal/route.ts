import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";

import { getMeals, handleMealError } from "@/services/meal.service";

export const GET = withDB(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);

    const recommendedParam = searchParams.get("isRecommended");

    const isRecommended =
      recommendedParam === "true"
        ? true
        : recommendedParam === "false"
        ? false
        : undefined;

    const limitParam = searchParams.get("limit");

    let limit: number | undefined;

    if (limitParam !== null) {
      const parsed = Number(limitParam);

      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "limit phải là số nguyên từ 1 đến 100",
          },
          { status: 400 }
        );
      }

      limit = parsed;
    }

    const meals = await getMeals(isRecommended, limit);

    return NextResponse.json({
      success: true,
      message: "Lấy danh sách món ăn thành công",
      data: meals,
    });
  } catch (error) {
    return handleMealError(error);
  }
});
