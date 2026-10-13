import { Schema, models, model } from "mongoose";

const mealIngredientSchema = new Schema(
  {
    ingredient_id: {
      type: Schema.Types.ObjectId,
      ref: "Ingredient",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const mealSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image_url: {
      type: String,
      default: "",
    },

    ingredients: {
      type: [mealIngredientSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "Phần cơm phải có ít nhất một nguyên liệu",
      },
    },

    is_recommended: {
      type: Boolean,
      default: false,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

mealSchema.index({
  is_active: 1,
  is_recommended: 1,
});

const Meal = models.Meal || model("Meal", mealSchema);

export default Meal;
