import mongoose, { Schema, models, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
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

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Category = models.Category || model("Category", categorySchema);

export default Category;
