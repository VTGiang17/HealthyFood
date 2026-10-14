import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireUser } from "@/libs/authorization";

import {
  updateCartItem,
  removeCartItem,
  handleCartError,
} from "@/services/cart.service";

import { updateCartItemSchema } from "@/validations/cart.schema";



// PUT /api/cart/items/:itemId
export const PUT = withDB<{ itemId: string }>(async (req, context) => {
  try {
    const user = await requireUser();
    const { itemId } = await context.params;

    const body = await req.json();
    const data = updateCartItemSchema.parse(body);

    const cart = await updateCartItem(
      user._id.toString(),
      itemId,
      data.quantity
    );

    return NextResponse.json({
      success: true,
      message: "Cập nhật giỏ hàng thành công",
      data: cart,
    });
  } catch (error) {
    return handleCartError(error);
  }
});

// DELETE /api/cart/items/:itemId
export const DELETE = withDB<{ itemId: string }>(async (_req, context) => {
  try {
    const user = await requireUser();
    const { itemId } = await context.params;

    const cart = await removeCartItem(user._id.toString(), itemId);

    return NextResponse.json({
      success: true,
      message: "Xóa món khỏi giỏ hàng thành công",
      data: cart,
    });
  } catch (error) {
    return handleCartError(error);
  }
});
