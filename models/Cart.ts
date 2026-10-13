import { Schema, models, model } from "mongoose";

const cartIngredientSchema = new Schema(
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

const cartItemSchema = new Schema({
  type: {
    type: String,
    enum: ["meal", "custom"],
    required: true,
  },

  meal_id: {
    type: Schema.Types.ObjectId,
    ref: "Meal",
    default: null,
  },

  ingredients: {
    type: [cartIngredientSchema],
    default: [],
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
});

const cartSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Cart = models.Cart || model("Cart", cartSchema);

export default Cart;
