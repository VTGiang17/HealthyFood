import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const userSchema = new mongoose.Schema(
  {
    full_name: String,
    email: String,
    phone: String,
    password: String,
    avatar: String,
    role: String,
    status: String,
  },
  {
    timestamps: true,
    collection: "users",
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function createAdmin() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;

    // Kiểm tra biến môi trường
    if (!mongoURI || !email || !password) {
      throw new Error(
        "Thiếu MONGODB_URI, SEED_ADMIN_EMAIL hoặc SEED_ADMIN_PASSWORD"
      );
    }

    // Kiểm tra email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new Error("Email Admin không hợp lệ");
    }

    // Kiểm tra mật khẩu
    if (password.length < 12) {
      throw new Error("Mật khẩu Admin phải có ít nhất 12 ký tự");
    }

    // Kết nối MongoDB
    await mongoose.connect(mongoURI);

    console.log("Đã kết nối MongoDB");

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Email đã tồn tại, không tạo tài khoản mới.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      full_name: "Heat&Heart Admin",
      email,
      phone: "",
      password: hashedPassword,
      avatar: "",
      role: "admin",
      status: "active",
    });

    console.log("Tạo tài khoản Admin thành công!");
    console.log("ID:", admin._id.toString());
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
  } catch (error) {
    console.error("Lỗi tạo Admin:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
