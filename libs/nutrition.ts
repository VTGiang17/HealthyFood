export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IngredientNutrition {
  nutrition: Nutrition;
  price_per_100g: number;
  quantity: number; // Số gram
}

export interface NutritionResult extends Nutrition {
  price: number;
}

export const calculateIngredientNutrition = (
  ingredient: IngredientNutrition
): NutritionResult => {
  const ratio = ingredient.quantity / 100;

  return {
    calories: ingredient.nutrition.calories * ratio,
    protein: ingredient.nutrition.protein * ratio,
    carbs: ingredient.nutrition.carbs * ratio,
    fat: ingredient.nutrition.fat * ratio,
    price: ingredient.price_per_100g * ratio,
  };
};

export const calculateTotalNutrition = (
  ingredients: IngredientNutrition[]
): NutritionResult => {
  return ingredients.reduce<NutritionResult>(
    (total, ingredient) => {
      const result = calculateIngredientNutrition(ingredient);

      return {
        calories: total.calories + result.calories,
        protein: total.protein + result.protein,
        carbs: total.carbs + result.carbs,
        fat: total.fat + result.fat,
        price: total.price + result.price,
      };
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      price: 0,
    }
  );
};
