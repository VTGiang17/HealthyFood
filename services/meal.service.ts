import "server-only";

import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import Meal from "@/models/Meal";
import Ingredient from "@/models/Ingredient";

import { AuthorizationError } from "@/libs/authorization";
import { calculateTotalNutrition } from "@/libs/nutrition";

import type {
  CreateMealInput,
  UpdateMealInput,
} from "@/validations/meal.schema";

export class MealError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "MealError";
  }
}

type MealListSort = "newest" | "priceAsc" | "priceDesc" | "calAsc";
type MealListCalories = "all" | "under300" | "300to500" | "over500";

export interface PaginatedMealOptions {
  page: number;
  limit: number;
  search?: string;
  calorieFilter?: MealListCalories;
  minPrice?: number;
  maxPrice?: number;
  sort?: MealListSort;
}

type MealItem = {
  ingredient_id: string;
  quantity: number;
};

interface MealData {
  _id: unknown;
  name: string;
  description: string;
  image_url: string;
  calories?: number | null;
  is_recommended: boolean;
  is_active: boolean;

  ingredients: {
    ingredient_id:
      | mongoose.Types.ObjectId
      | {
          _id: mongoose.Types.ObjectId;
          name: string;
          image_url?: string;
        };
    quantity: number;
  }[];
}

const validateIngredients = async (
  items: MealItem[],
  allowInactive = false,
) => {
  if (items.length === 0) {
    throw new MealError("Phần cơm phải có ít nhất một nguyên liệu", 400);
  }

  const ids = items.map((item) => item.ingredient_id.toLowerCase());

  if (new Set(ids).size !== ids.length) {
    throw new MealError("Nguyên liệu bị trùng", 400);
  }

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw new MealError("ID nguyên liệu không hợp lệ", 400);
  }

  const filter: Record<string, unknown> = {
    _id: { $in: ids },
  };

  if (!allowInactive) {
    filter.is_active = true;
  }

  const ingredients = await Ingredient.find(filter).lean();

  if (ingredients.length !== ids.length) {
    throw new MealError("Có nguyên liệu không tồn tại hoặc đã bị ẩn", 400);
  }

  const ingredientMap = new Map(
    ingredients.map((ingredient) => [ingredient._id.toString(), ingredient]),
  );

  const nutritionItems = items.map((item) => {
    const ingredient = ingredientMap.get(item.ingredient_id.toLowerCase());

    if (!ingredient) {
      throw new MealError("Nguyên liệu không tồn tại", 400);
    }

    const { min_grams, max_grams, step_grams } = ingredient;

    const steps = (item.quantity - min_grams) / step_grams;

    const validStep = Math.abs(steps - Math.round(steps)) < 1e-8;

    if (
      !Number.isFinite(item.quantity) ||
      item.quantity < min_grams ||
      item.quantity > max_grams ||
      !validStep
    ) {
      throw new MealError(`Số gram của ${ingredient.name} không hợp lệ`, 400);
    }

    return {
      nutrition: ingredient.nutrition,
      price_per_100g: ingredient.price_per_100g,
      quantity: item.quantity,
    };
  });

  return calculateTotalNutrition(nutritionItems);
};

const formatMeal = async (meal: MealData) => {
  const items: MealItem[] = meal.ingredients.map((item) => {
    const ingredient = item.ingredient_id;

    const ingredientId =
      ingredient instanceof mongoose.Types.ObjectId
        ? ingredient.toString()
        : ingredient._id.toString();

    return {
      ingredient_id: ingredientId,
      quantity: item.quantity,
    };
  });

  const totals = await validateIngredients(items, true);

  const calculatedCalories = Math.round(totals.calories);

  const manualCalories = meal.calories;

  const finalCalories =
    manualCalories != null ? manualCalories : calculatedCalories;

  return {
    ...meal,
    calories: manualCalories ?? null,

    totals: {
      calories: finalCalories,
      calculated_calories: calculatedCalories,
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      price: Math.round(totals.price),
    },
  };
};

export const getMeals = async (isRecommended?: boolean, limit?: number) => {
  const filter: Record<string, unknown> = {
    is_active: true,
  };

  if (isRecommended !== undefined) {
    filter.is_recommended = isRecommended;
  }

  const query = Meal.find(filter).sort({
    createdAt: -1,
  });

  if (limit !== undefined) {
    query.limit(limit);
  }

  const meals = await query.lean();

  return Promise.all(meals.map(formatMeal));
};

export const getMealById = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new MealError("ID món ăn không hợp lệ", 400);
  }

  const meal = await Meal.findOne({
    _id: id,
    is_active: true,
  })
    .populate({
      path: "ingredients.ingredient_id",
      select: "name image_url",
    })
    .lean();

  if (!meal) {
    throw new MealError("Không tìm thấy món ăn", 404);
  }

  return formatMeal(meal);
};

export const createMeal = async (data: CreateMealInput) => {
  await validateIngredients(data.ingredients);

  return Meal.create(data);
};

export const updateMeal = async (id: string, data: UpdateMealInput) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new MealError("ID món ăn không hợp lệ", 400);
  }

  const meal = await Meal.findById(id);

  if (!meal) {
    throw new MealError("Không tìm thấy món ăn", 404);
  }

  if (data.ingredients) {
    await validateIngredients(data.ingredients);
  }

  meal.set(data);
  await meal.save();

  return meal;
};

export const deleteMeal = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new MealError("ID món ăn không hợp lệ", 400);
  }

  const meal = await Meal.findByIdAndUpdate(
    id,
    { is_active: false },
    { new: true },
  );

  if (!meal) {
    throw new MealError("Không tìm thấy món ăn", 404);
  }

  return meal;
};

export const handleMealError = (error: unknown) => {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: error.issues,
      },
      { status: 400 },
    );
  }

  if (error instanceof MealError || error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        success: false,
        message: "JSON không hợp lệ",
      },
      { status: 400 },
    );
  }

  console.error("Meal error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Lỗi máy chủ",
    },
    { status: 500 },
  );
};

const sumIngredientField = (
  field: "price_per_100g" | "nutrition.calories",
) => ({
  $sum: {
    $map: {
      input: { $ifNull: ["$ingredients", []] },
      as: "entry",
      in: {
        $let: {
          vars: {
            ingredient: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$__ingredient_docs",
                    as: "doc",
                    cond: { $eq: ["$$doc._id", "$$entry.ingredient_id"] },
                  },
                },
                0,
              ],
            },
          },
          in: {
            $multiply: [
              { $divide: ["$$entry.quantity", 100] },
              { $ifNull: [`$$ingredient.${field}`, 0] },
            ],
          },
        },
      },
    },
  },
});

export const getPaginatedMeals = async ({
  page,
  limit,
  search = "",
  calorieFilter = "all",
  minPrice = 0,
  maxPrice,
  sort = "newest",
}: PaginatedMealOptions) => {
  const match: Record<string, unknown> = { is_active: true };

  if (search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
    ];
  }

  const calculatedFilter: Record<string, unknown> = {};
  const priceConditions: Record<string, number> = { $gte: minPrice };
  if (maxPrice !== undefined) priceConditions.$lte = maxPrice;
  calculatedFilter.__price = priceConditions;

  if (calorieFilter === "under300") calculatedFilter.__calories = { $lt: 300 };
  if (calorieFilter === "300to500")
    calculatedFilter.__calories = { $gte: 300, $lte: 500 };
  if (calorieFilter === "over500") calculatedFilter.__calories = { $gt: 500 };

  const sorting: Record<string, 1 | -1> =
    sort === "priceAsc"
      ? { __price: 1, _id: 1 }
      : sort === "priceDesc"
        ? { __price: -1, _id: -1 }
        : sort === "calAsc"
          ? { __calories: 1, _id: 1 }
          : { createdAt: -1, _id: -1 };

  const pipeline: mongoose.PipelineStage[] = [
    { $match: match },
    {
      $lookup: {
        from: Ingredient.collection.name,
        localField: "ingredients.ingredient_id",
        foreignField: "_id",
        as: "__ingredient_docs",
      },
    },
    {
      $addFields: {
        __price: { $round: [sumIngredientField("price_per_100g"), 0] },
        __calculatedCalories: {
          $round: [sumIngredientField("nutrition.calories"), 0],
        },
      },
    },
    {
      $addFields: {
        __calories: { $ifNull: ["$calories", "$__calculatedCalories"] },
      },
    },
    { $match: calculatedFilter },
    { $sort: sorting },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        records: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              __ingredient_docs: 0,
              __price: 0,
              __calories: 0,
              __calculatedCalories: 0,
            },
          },
        ],
      },
    },
  ];

  const [result] = await Meal.aggregate(pipeline);
  const total = Number(result?.metadata?.[0]?.total ?? 0);
  const meals = await Promise.all(
    ((result?.records ?? []) as MealData[]).map(formatMeal),
  );

  return {
    meals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};
