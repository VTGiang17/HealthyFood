import { NextResponse } from "next/server";

import { withDB } from "@/libs/apiHandler";
import { requireAdmin } from "@/libs/authorization";

import { getAllOrders, handleOrderError } from "@/services/order.service";

const validStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
];

// GET /api/admin/orders
// GET /api/admin/orders?status=pending
export const GET = withDB(async (req: Request) => {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Trạng thái đơn hàng không hợp lệ",
        },
        { status: 400 }
      );
    }

    const orders = await getAllOrders(status || undefined);

    return NextResponse.json({
      success: true,
      message: "Lấy danh sách đơn hàng thành công",
      data: orders,
    });
  } catch (error) {
    return handleOrderError(error);
  }
});
