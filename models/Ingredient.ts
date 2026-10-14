import mongoose, { Schema, models, model } from "mongoose";

const ingredientSchema = new Schema(
  {
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

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

    nutrition: {
      calories: { type: Number, required: true, min: 0 },
      protein: { type: Number, required: false, min: 0 },
      carbs: { type: Number, required: false, min: 0 },
      fat: { type: Number, required: false, min: 0 },
    },

    price_per_100g: {
      type: Number,
      required: true,
      min: 0,
    },

    min_grams: {
      type: Number,
      required: true,
      min: 1,
    },

    max_grams: {
      type: Number,
      required: true,
      min: 1,
    },

    step_grams: {
      type: Number,
      required: true,
      min: 1,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

ingredientSchema.index({ category_id: 1, is_active: 1 });
ingredientSchema.index({ name: 1 });

const Ingredient = models.Ingredient || model("Ingredient", ingredientSchema);

export default Ingredient;
