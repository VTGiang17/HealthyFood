"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";

import { Eye, RefreshCw, Search, ShoppingBag } from "lucide-react";

import {
  type AdminOrder,
  type OrderItem,
  type OrderStatus,
  getAdminOrders,
  getAdminOrderDetail,
  updateOrderStatus,
} from "@/api/admin/order";

import { getErrorMessage, getList, money } from "@/libs/adminHelpers";

const STATUS: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    next: OrderStatus[];
  }
> = {
  pending: {
    label: "Chờ xác nhận",
    color: "gold",
    next: ["confirmed", "cancelled"],
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "blue",
    next: ["preparing", "cancelled"],
  },
  preparing: {
    label: "Đang chuẩn bị",
    color: "cyan",
    next: ["delivering", "cancelled"],
  },
  delivering: {
    label: "Đang giao",
    color: "geekblue",
    next: ["completed"],
  },
  completed: {
    label: "Hoàn thành",
    color: "green",
    next: [],
  },
  cancelled: {
    label: "Đã hủy",
    color: "red",
    next: [],
  },
};

const displayDate = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

function customerInfo(order: AdminOrder) {
  const user =
    order.user_id && typeof order.user_id === "object" ? order.user_id : null;

  const shipping =
    order.shipping_address && typeof order.shipping_address === "object"
      ? order.shipping_address
      : null;

  return {
    name:
      order.receiver_name ||
      order.customer_name ||
      shipping?.full_name ||
      user?.full_name ||
      user?.name ||
      "Khách hàng",

    phone: order.phone || shipping?.phone || user?.phone || "—",

    email: user?.email || "—",

    address:
      order.address ||
      shipping?.address ||
      (typeof order.shipping_address === "string"
        ? order.shipping_address
        : "") ||
      "—",
  };
}

function itemName(item: OrderItem) {
  if (item.name) return item.name;
  if (item.meal_name) return item.meal_name;

  if (item.meal_id && typeof item.meal_id === "object") {
    return item.meal_id.name;
  }

  return "Món ăn";
}

function orderTotal(order: AdminOrder) {
  return order.total_amount ?? order.total_price ?? 0;
}

export default function OrdersPage() {
  const { message } = App.useApp();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState<AdminOrder | null>(null);

  // Lấy danh sách đơn hàng
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getAdminOrders();

      setOrders(getList<AdminOrder>(response.data, "orders"));
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  // Tìm kiếm và lọc trạng thái
  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const customer = customerInfo(order);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const searchable = [
        order._id,
        customer.name,
        customer.phone,
        customer.email,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchable.includes(keyword);
    });
  }, [orders, search, statusFilter]);

  // Xem chi tiết
  const openDetail = async (order: AdminOrder) => {
    setDetail(order);

    try {
      setDetailLoading(true);

      const response = await getAdminOrderDetail(order._id);

      if (response.data.data) {
        setDetail(response.data.data);
      }
    } catch (error) {
      // Giữ dữ liệu từ danh sách nếu API chi tiết
      // chưa được Backend triển khai.
      message.warning("Đang hiển thị thông tin đơn hàng từ danh sách");
    } finally {
      setDetailLoading(false);
    }
  };

  // Cập nhật trạng thái
  const handleUpdateStatus = async (order: AdminOrder, status: OrderStatus) => {
    try {
      setSaving(true);

      await updateOrderStatus(order._id, status);

      message.success("Cập nhật trạng thái thành công");

      setDetail(null);
      await fetchOrders();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<AdminOrder> = [
    {
      title: "Mã đơn",
      width: 135,
      render: (_, order) => (
        <span className="font-mono text-xs font-bold">
          #{order._id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      title: "Khách hàng",
      render: (_, order) => {
        const customer = customerInfo(order);

        return (
          <div>
            <p className="font-semibold">{customer.name}</p>
            <p className="mt-1 text-xs text-gray-500">{customer.phone}</p>
          </div>
        );
      },
    },
    {
      title: "Số lượng",
      align: "center",
      render: (_, order) =>
        (order.items || []).reduce((sum, item) => sum + item.quantity, 0),
    },
    {
      title: "Tổng tiền",
      render: (_, order) => (
        <strong className="text-[#16834b]">{money(orderTotal(order))}</strong>
      ),
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      render: (date?: string) => displayDate(date),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: OrderStatus) => (
        <Tag color={STATUS[status]?.color ?? "default"}>
          {STATUS[status]?.label ?? status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Button
          type="link"
          icon={<Eye size={16} />}
          onClick={() => openDetail(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1d3829]">
          Quản lý đơn hàng
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Theo dõi và xử lý đơn đặt hàng HealthyBowl
        </p>
      </div>

      {/* DANH SÁCH */}
      <Card className="!rounded-2xl !border-gray-100 !shadow-sm">
        <div className="mb-5 flex flex-wrap gap-3">
          <Input
            allowClear
            size="large"
            className="!max-w-[350px]"
            placeholder="Mã đơn, tên khách hàng, SĐT..."
            prefix={<Search size={17} />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Select
            size="large"
            className="!w-[190px]"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              {
                value: "all",
                label: "Tất cả trạng thái",
              },
              ...Object.entries(STATUS).map(([value, status]) => ({
                value,
                label: status.label,
              })),
            ]}
          />

          <Button
            icon={<RefreshCw size={16} />}
            loading={loading}
            onClick={fetchOrders}
          >
            Làm mới
          </Button>
        </div>

        <Table<AdminOrder>
          rowKey="_id"
          dataSource={filteredOrders}
          columns={columns}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn hàng`,
          }}
          locale={{
            emptyText: (
              <div className="py-8 text-center text-gray-400">
                <ShoppingBag size={32} className="mx-auto mb-3" />
                Chưa có đơn hàng nào
              </div>
            ),
          }}
        />
      </Card>

      {/* CHI TIẾT ĐƠN HÀNG */}
      <Drawer
        title={
          detail
            ? `Đơn hàng #${detail._id.slice(-8).toUpperCase()}`
            : "Chi tiết đơn hàng"
        }
        open={!!detail}
        width={620}
        loading={detailLoading}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Tag color={STATUS[detail.status]?.color ?? "default"}>
                {STATUS[detail.status]?.label ?? detail.status}
              </Tag>

              <span className="text-xs text-gray-500">
                {displayDate(detail.createdAt)}
              </span>
            </div>

            <div>
              <h3 className="mb-3 font-bold text-[#1d3829]">
                Thông tin giao hàng
              </h3>

              <Descriptions
                bordered
                size="small"
                column={1}
                items={[
                  {
                    key: "name",
                    label: "Người nhận",
                    children: customerInfo(detail).name,
                  },
                  {
                    key: "phone",
                    label: "Số điện thoại",
                    children: customerInfo(detail).phone,
                  },
                  {
                    key: "email",
                    label: "Email",
                    children: customerInfo(detail).email,
                  },
                  {
                    key: "address",
                    label: "Địa chỉ",
                    children: customerInfo(detail).address,
                  },
                  {
                    key: "note",
                    label: "Ghi chú",
                    children: detail.note || "—",
                  },
                  {
                    key: "payment",
                    label: "Thanh toán",
                    children: detail.payment_method || "—",
                  },
                ]}
              />
            </div>

            {/* DANH SÁCH MÓN */}
            <div>
              <h3 className="mb-3 font-bold text-[#1d3829]">Chi tiết món ăn</h3>

              <div className="divide-y rounded-xl border border-gray-100">
                {(detail.items || []).map((item, index) => (
                  <div
                    key={item._id || index}
                    className="flex justify-between gap-4 p-4"
                  >
                    <div>
                      <p className="font-semibold">{itemName(item)}</p>

                      <p className="mt-1 text-xs text-gray-500">
                        Số lượng: {item.quantity}
                      </p>

                      <Typography.Text type="secondary">
                        {money(item.unit_price ?? item.price ?? 0)}
                        /phần
                      </Typography.Text>
                    </div>

                    <strong>
                      {money(
                        item.subtotal ??
                          (item.unit_price ?? item.price ?? 0) * item.quantity
                      )}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-lg font-bold">
                <span>Tổng thanh toán</span>
                <span className="text-[#16834b]">
                  {money(orderTotal(detail))}
                </span>
              </div>
            </div>

            {/* CHUYỂN TRẠNG THÁI */}
            {STATUS[detail.status]?.next.length > 0 && (
              <div>
                <h3 className="mb-3 font-bold text-[#1d3829]">
                  Xử lý đơn hàng
                </h3>

                <Space wrap>
                  {STATUS[detail.status].next.map((nextStatus) => (
                    <Popconfirm
                      key={nextStatus}
                      title="Xác nhận cập nhật?"
                      description={`Chuyển đơn hàng sang "${STATUS[nextStatus].label}"?`}
                      okText="Xác nhận"
                      cancelText="Hủy"
                      onConfirm={() => handleUpdateStatus(detail, nextStatus)}
                    >
                      <Button
                        type={
                          nextStatus === "cancelled" ? "default" : "primary"
                        }
                        danger={nextStatus === "cancelled"}
                        loading={saving}
                      >
                        {STATUS[nextStatus].label}
                      </Button>
                    </Popconfirm>
                  ))}
                </Space>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
