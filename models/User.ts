import mongoose, { Schema, models, model } from "mongoose";

const userSchema = new Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },

    avatar: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const User = models.User || model("User", userSchema);

export default User;
