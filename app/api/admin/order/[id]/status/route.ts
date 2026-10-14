import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import { updateOrderStatus, handleOrderError } from "@/services/order.service";

import { orderStatusSchema } from "@/validations/order.schema";



// PATCH /api/admin/orders/:id/status
export const PATCH = withDB<{ id: string }>(async (req, context) => {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await req.json();

    const data = orderStatusSchema.parse(body);

    const order = await updateOrderStatus(id, data.status);

    return NextResponse.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: order,
    });
  } catch (error) {
    return handleOrderError(error);
  }
});
