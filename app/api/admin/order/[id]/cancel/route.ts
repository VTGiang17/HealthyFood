import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireUser } from "@/libs/authorization";

import { cancelMyOrder, handleOrderError } from "@/services/order.service";

export const PATCH = withDB<{ id: string }>(async (_req, context) => {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const order = await cancelMyOrder(id, user._id.toString());

    return NextResponse.json({
      success: true,
      message: "Hủy đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    return handleOrderError(error);
  }
});
