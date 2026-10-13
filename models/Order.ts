import { Schema, models, model } from "mongoose";

const orderIngredientSchema = new Schema(
  {
    ingredient_id: {
      type: Schema.Types.ObjectId,
      ref: "Ingredient",
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
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

    name: {
      type: String,
      required: true,
    },

    image_url: {
      type: String,
      default: "",
    },

    ingredients: {
      type: [orderIngredientSchema],
      default: [],
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unit_price: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver_name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    note: {
      type: String,
      default: "",
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    total_price: {
      type: Number,
      required: true,
      min: 0,
    },

    payment_method: {
      type: String,
      enum: ["cod"],
      default: "cod",
    },

    payment_status: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "delivering",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    cancelled_at: {
      type: Date,
      default: null,
    },

    completed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user_id: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = models.Order || model("Order", orderSchema);

export default Order;
