import { NextResponse } from "next/server";
import { withDB } from "@/libs/apiHandler";
import {
  getMeals,
  getPaginatedMeals,
  handleMealError,
} from "@/services/meal.service";

const SORTS = ["newest", "priceAsc", "priceDesc", "calAsc"] as const;
const CALORIE_FILTERS = ["all", "under300", "300to500", "over500"] as const;

export const GET = withDB(async (req: Request) => {
  try {
    const params = new URL(req.url).searchParams;
    const isRecommended =
      params.get("isRecommended") === "true"
        ? true
        : params.get("isRecommended") === "false"
          ? false
          : undefined;
    const pageParam = params.get("page");
    const limitParam = params.get("limit");
    const limit =
      limitParam === null
        ? pageParam === null
          ? undefined
          : 9
        : Number(limitParam);

    if (
      limit !== undefined &&
      (!Number.isInteger(limit) || limit < 1 || limit > 100)
    ) {
      return NextResponse.json(
        { success: false, message: "limit phải từ 1 đến 100" },
        { status: 400 },
      );
    }

    if (pageParam === null) {
      const meals = await getMeals(isRecommended, limit);
      return NextResponse.json({
        success: true,
        message: "Lấy danh sách món ăn thành công",
        data: meals,
      });
    }

    const page = Number(pageParam);
    const sortInput = params.get("sort") ?? "newest";
    const calorieInput = params.get("calorieFilter") ?? "all";
    const minPrice = Number(params.get("minPrice") ?? "0");
    const maxPriceRaw = params.get("maxPrice");
    const maxPrice = maxPriceRaw === null ? undefined : Number(maxPriceRaw);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !SORTS.some((s) => s === sortInput) ||
      !CALORIE_FILTERS.some((s) => s === calorieInput) ||
      !Number.isFinite(minPrice) ||
      minPrice < 0 ||
      (maxPrice !== undefined &&
        (!Number.isFinite(maxPrice) || maxPrice < minPrice))
    ) {
      return NextResponse.json(
        { success: false, message: "Tham số lọc hoặc phân trang không hợp lệ" },
        { status: 400 },
      );
    }

    const result = await getPaginatedMeals({
      page,
      limit: limit ?? 9,
      search: params.get("search") ?? "",
      sort: sortInput as (typeof SORTS)[number],
      calorieFilter: calorieInput as (typeof CALORIE_FILTERS)[number],
      minPrice,
      maxPrice,
    });

    return NextResponse.json({
      success: true,
      message: "Lấy danh sách món ăn thành công",
      data: result.meals,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleMealError(error);
  }
});
