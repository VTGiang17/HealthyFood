import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireUser } from "@/libs/authorization";

import {
  createOrder,
  getMyOrders,
  handleOrderError,
} from "@/services/order.service";

import { createOrderSchema } from "@/validations/order.schema";



// GET /api/orders
export const GET = withDB(async () => {
  try {
    const user = await requireUser();

    const orders = await getMyOrders(user._id.toString());

    return NextResponse.json({
      success: true,
      message: "Lấy danh sách đơn hàng thành công",
      data: orders,
    });
  } catch (error) {
    return handleOrderError(error);
  }
});

// POST /api/orders
export const POST = withDB(async (req: Request) => {
  try {
    const user = await requireUser();

    const body = await req.json();
    const data = createOrderSchema.parse(body);

    const order = await createOrder(user._id.toString(), data);

    return NextResponse.json(
      {
        success: true,
        message: "Đặt hàng thành công",
        data: order,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleOrderError(error);
  }
});
