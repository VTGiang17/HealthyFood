import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireUser } from "@/libs/authorization";

import { getOrderById, handleOrderError } from "@/services/order.service";

export const runtime = "nodejs";

export const GET = withDB<{ id: string }>(async (_req, context) => {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const order = await getOrderById(id, user._id.toString());

    return NextResponse.json({
      success: true,
      message: "Lấy chi tiết đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    return handleOrderError(error);
  }
});
