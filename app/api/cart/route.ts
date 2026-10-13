import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireUser } from "@/libs/authorization";

import {
  getCart,
  addCartItem,
  clearCart,
  handleCartError,
} from "@/services/cart.service";

import { addCartItemSchema } from "@/validations/cart.schema";

export const runtime = "nodejs";

// GET /api/cart
export const GET = withDB(async () => {
  try {
    const user = await requireUser();

    const cart = await getCart(user._id.toString());

    return NextResponse.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    return handleCartError(error);
  }
});

// POST /api/cart
export const POST = withDB(async (req: Request) => {
  try {
    const user = await requireUser();

    const body = await req.json();
    const data = addCartItemSchema.parse(body);

    const cart = await addCartItem(user._id.toString(), data);

    return NextResponse.json(
      {
        success: true,
        message: "Thêm vào giỏ hàng thành công",
        data: cart,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleCartError(error);
  }
});

// DELETE /api/cart
export const DELETE = withDB(async () => {
  try {
    const user = await requireUser();

    const cart = await clearCart(user._id.toString());

    return NextResponse.json({
      success: true,
      message: "Đã xóa toàn bộ giỏ hàng",
      data: cart,
    });
  } catch (error) {
    return handleCartError(error);
  }
});
