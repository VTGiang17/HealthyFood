"use client";

import { useMemo } from "react";
import { Card, Form, Statistic } from "antd";
import { Flame, Scale, Wallet } from "lucide-react";

import type { Ingredient } from "@/api/admin/ingredient";

import { money } from "@/libs/adminHelpers";

interface SelectedIngredient {
  ingredient_id: string;
  quantity: number;
}

interface Props {
  ingredients: Ingredient[];
}

export default function MealNutritionPreview({ ingredients }: Props) {
  const form = Form.useFormInstance();

  const selected = Form.useWatch("ingredients", form) as
    | SelectedIngredient[]
    | undefined;

  const totals = useMemo(() => {
    let grams = 0;
    let calories = 0;
    let price = 0;

    for (const item of selected || []) {
      if (!item?.ingredient_id || !item?.quantity) {
        continue;
      }

      const ingredient = ingredients.find(
        (value) => value._id === item.ingredient_id
      );

      if (!ingredient) continue;

      const quantity = Number(item.quantity);

      grams += quantity;

      calories += (ingredient.nutrition.calories * quantity) / 100;

      price += (ingredient.price_per_100g * quantity) / 100;
    }

    return {
      grams,
      calories: Math.round(calories * 10) / 10,
      price: Math.round(price),
    };
  }, [selected, ingredients]);

  return (
    <Card
      size="small"
      className="!mt-5 !rounded-xl !border-green-100 !bg-green-50/50"
      title="Tổng dinh dưỡng và giá nguyên liệu"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Statistic
          title={
            <span className="inline-flex items-center gap-2">
              <Scale size={16} />
              Khối lượng
            </span>
          }
          value={totals.grams}
          suffix="g"
        />

        <Statistic
          title={
            <span className="inline-flex items-center gap-2">
              <Flame size={16} />
              Calories
            </span>
          }
          value={totals.calories}
          suffix="kcal"
        />

        <Statistic
          title={
            <span className="inline-flex items-center gap-2">
              <Wallet size={16} />
              Giá nguyên liệu
            </span>
          }
          value={money(totals.price)}
        />
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Giá trên chỉ tính nguyên liệu, chưa bao gồm bao bì, nhân công hoặc lợi
        nhuận.
      </p>
    </Card>
  );
}
