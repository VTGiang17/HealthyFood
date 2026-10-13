import "server-only";

import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import Order from "@/models/Order";
import Cart from "@/models/Cart";

import { getCart } from "@/services/cart.service";
import { AuthorizationError } from "@/libs/authorization";

import type { CreateOrderInput, OrderStatus } from "@/validations/order.schema";

export class OrderError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "OrderError";
  }
}

const validateId = (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new OrderError("ID đơn hàng không hợp lệ", 400);
  }
};

// Tạo đơn hàng từ giỏ hàng
export const createOrder = async (userId: string, data: CreateOrderInput) => {
  const token = randomUUID();
  const now = new Date();

  // Khóa giỏ hàng bằng thao tác nguyên tử.
  const lockedCart = await Cart.findOneAndUpdate(
    {
      user_id: userId,
      checkout_token: null,
      "items.0": { $exists: true },
    },
    {
      $set: {
        checkout_token: token,
        checkout_locked_at: now,
      },
    },
    { new: true }
  );

  if (!lockedCart) {
    throw new OrderError("Giỏ hàng trống hoặc đang được xử lý", 409);
  }

  try {
    const cart = await getCart(userId);

    if (cart.items.length === 0) {
      throw new OrderError("Giỏ hàng trống", 400);
    }

    const orderItems = cart.items.map((item) => {
      const details = item.details as any;

      const ingredients =
        item.type === "custom"
          ? details.map((ingredient: any) => ({
              ingredient_id: ingredient.ingredient_id,
              name: ingredient.name,
              quantity: ingredient.quantity,
            }))
          : [];

      return {
        type: item.type,
        meal_id: item.meal_id,
        name: item.name,
        image_url: item.image_url,
        ingredients,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        nutrition: {
          calories: item.calories / item.quantity,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      };
    });

    const session = await mongoose.startSession();

    try {
      let orderId = "";

      await session.withTransaction(async () => {
        const currentCart = await Cart.findOne({
          user_id: userId,
          checkout_token: token,
        }).session(session);

        if (!currentCart || currentCart.items.length === 0) {
          throw new OrderError("Giỏ hàng không còn hợp lệ", 409);
        }

        const [order] = await Order.create(
          [
            {
              user_id: userId,
              ...data,
              items: orderItems,
              total_price: cart.totals.total_price,
              payment_status: "unpaid",
              status: "pending",
            },
          ],
          { session }
        );

        orderId = order._id.toString();

        currentCart.items = [];
        currentCart.checkout_token = null;
        currentCart.checkout_locked_at = null;

        await currentCart.save({ session });
      });

      return Order.findById(orderId).lean();
    } finally {
      await session.endSession();
    }
  } finally {
    await Cart.updateOne(
      {
        user_id: userId,
        checkout_token: token,
      },
      {
        $set: {
          checkout_token: null,
          checkout_locked_at: null,
        },
      }
    );
  }
};

// Lịch sử đơn hàng của khách
export const getMyOrders = async (userId: string) => {
  return Order.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
};

// Chi tiết đơn hàng
export const getOrderById = async (
  id: string,
  userId: string,
  isAdmin = false
) => {
  validateId(id);

  const filter: Record<string, unknown> = {
    _id: id,
  };

  if (!isAdmin) {
    filter.user_id = userId;
  }

  const order = await Order.findOne(filter).lean();

  if (!order) {
    throw new OrderError("Không tìm thấy đơn hàng", 404);
  }

  return order;
};

// Khách hàng hủy đơn đang chờ
export const cancelMyOrder = async (id: string, userId: string) => {
  validateId(id);

  const order = await Order.findOneAndUpdate(
    {
      _id: id,
      user_id: userId,
      status: "pending",
    },
    {
      $set: {
        status: "cancelled",
        cancelled_at: new Date(),
      },
    },
    { new: true }
  );

  if (!order) {
    throw new OrderError("Không tìm thấy đơn hoặc đơn không thể hủy", 409);
  }

  return order;
};

// Admin lấy danh sách đơn
export const getAllOrders = async (status?: string) => {
  const filter: Record<string, unknown> = {};

  if (status) {
    filter.status = status;
  }

  return Order.find(filter)
    .populate("user_id", "full_name email phone")
    .sort({ createdAt: -1 })
    .lean();
};

// Quy tắc chuyển trạng thái
const allowedTransitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["delivering", "cancelled"],
  delivering: ["completed"],
  completed: [],
  cancelled: [],
};

// Admin cập nhật trạng thái
export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  validateId(id);

  const order = await Order.findById(id);

  if (!order) {
    throw new OrderError("Không tìm thấy đơn hàng", 404);
  }

  if (!allowedTransitions[order.status]?.includes(status)) {
    throw new OrderError(
      `Không thể chuyển từ ${order.status} sang ${status}`,
      400
    );
  }

  const changes: Record<string, unknown> = {
    status,
  };

  if (status === "cancelled") {
    changes.cancelled_at = new Date();
  }

  if (status === "completed") {
    changes.completed_at = new Date();

    if (order.payment_method === "cod") {
      changes.payment_status = "paid";
    }
  }

  const updated = await Order.findOneAndUpdate(
    {
      _id: id,
      status: order.status,
    },
    { $set: changes },
    { new: true }
  );

  if (!updated) {
    throw new OrderError("Trạng thái đơn đã thay đổi, vui lòng thử lại", 409);
  }

  return updated;
};

export const handleOrderError = (error: unknown) => {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: error.issues,
      },
      { status: 400 }
    );
  }

  if (error instanceof OrderError || error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        success: false,
        message: "JSON không hợp lệ",
      },
      { status: 400 }
    );
  }

  console.error("Order error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Lỗi máy chủ",
    },
    { status: 500 }
  );
};
