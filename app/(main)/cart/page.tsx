"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { App, Button, Empty, Form, Input, Modal, Popconfirm, Spin } from "antd";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import {
  getCart,
  updateCartQuantity,
  removeCartItem,
  type CartItem,
} from "@/api/cart";
import { createOrder, type CreateOrderPayload } from "@/api/order";

const money = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + "đ";
type DeliveryForm = {
  receiver_name: string;
  phone: string;
  address: string;
  note?: string;
};
const readableError = (e: unknown) =>
  isAxiosError(e)
    ? (e.response?.data as { message?: string } | undefined)?.message ||
      "Yêu cầu thất bại, vui lòng thử lại"
    : e instanceof Error
    ? e.message
    : "Yêu cầu thất bại";

export default function CartPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<DeliveryForm>();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const response = await getCart();
      if (!response.data.success)
        throw new Error(response.data.message || "Không thể tải giỏ hàng");
      const data = response.data.data;
      setItems(Array.isArray(data?.items) ? data.items : []);
      setError("");
      setNeedsLogin(false);
    } catch (e: unknown) {
      setError(readableError(e));
      setNeedsLogin(isAxiosError(e) && e.response?.status === 401);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);
  useEffect(() => {
    const refresh = () => {
      void load();
    };
    window.addEventListener("cart-updated", refresh);
    return () => window.removeEventListener("cart-updated", refresh);
  }, [load]);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    [items]
  );

  const changeQuantity = async (item: CartItem, quantity: number) => {
    if (busyId || quantity < 1 || quantity > 99) return;
    setBusyId(item._id);
    try {
      const response = await updateCartQuantity(item._id, quantity);
      if (!response.data.success)
        throw new Error(response.data.message || "Không thể sửa số lượng");
      await load();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      message.error(readableError(e));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: CartItem) => {
    if (busyId) return;
    setBusyId(item._id);
    try {
      const response = await removeCartItem(item._id);
      if (!response.data.success)
        throw new Error(response.data.message || "Không thể xóa món");
      await load();
      window.dispatchEvent(new Event("cart-updated"));
      message.success("Đã xóa món khỏi giỏ hàng");
    } catch (e) {
      message.error(readableError(e));
    } finally {
      setBusyId(null);
    }
  };

  const checkout = async () => {
    if (ordering || !items.length) return;
    try {
      const values = await form.validateFields();
      setOrdering(true);
      const payload: CreateOrderPayload = {
        receiver_name: values.receiver_name.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        note: values.note?.trim() || "",
        payment_method: "cod",
      };
      const response = await createOrder(payload);
      if (!response.data.success)
        throw new Error(response.data.message || "Tạo đơn thất bại");
      // Backend phải tự xóa giỏ trong thao tác tạo đơn thành công.
      setItems([]);
      setCheckoutOpen(false);
      form.resetFields();
      window.dispatchEvent(new Event("cart-updated"));
      message.success(
        `Đặt hàng thành công! Mã đơn: ${
          response.data.data?._id || "đang xử lý"
        }`,
        6
      );
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      message.error(readableError(e));
    } finally {
      setOrdering(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1200px] px-5 py-9 lg:px-8">
      <Link
        href="/meals"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#145b38]"
      >
        <ArrowLeft size={16} /> Tiếp tục chọn món
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#182a20]">Giỏ hàng</h1>
        <p className="mt-2 text-sm text-gray-500">
          Bạn đang có {totalQuantity} suất ăn trong giỏ hàng
        </p>
      </div>
      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center">
          <Spin size="large" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[#e6ece3] bg-white p-10 text-center">
          <p className="mb-4 text-sm text-red-500">{error}</p>
          {needsLogin ? (
            <Link
              href="/login?next=%2Fcart"
              className="font-bold text-[#145b38]"
            >
              Đăng nhập để xem giỏ hàng →
            </Link>
          ) : (
            <Button onClick={() => void load(true)}>Thử lại</Button>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[#edf0eb] bg-white px-5 py-20">
          <Empty description="Giỏ hàng của bạn đang trống">
            <Link
              href="/meals"
              className="inline-flex h-11 items-center rounded-full bg-[#145b38] px-6 text-sm font-bold text-white"
            >
              Khám phá thực đơn <ArrowRight size={15} className="ml-2" />
            </Link>
          </Empty>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section className="overflow-hidden rounded-2xl border border-[#edf0eb] bg-white">
            <div className="border-b border-[#edf0eb] px-5 py-4">
              <h2 className="font-extrabold text-[#183227]">Món ăn của bạn</h2>
            </div>
            <ul className="divide-y divide-[#edf0eb]">
              {items.map((item) => (
                <li key={item._id} className="flex gap-4 p-4 sm:p-5">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#edf3e9]">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#145b38]">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#23392b]">
                          {item.name}
                        </h3>
                        {item.nutrition?.calories != null && (
                          <p className="mt-1 text-xs text-gray-500">
                            {item.nutrition.calories} kcal
                          </p>
                        )}
                        {item.available === false && (
                          <p className="mt-1 text-xs text-red-500">
                            {item.error || "Món không khả dụng"}
                          </p>
                        )}
                        <p className="mt-2 text-sm font-bold text-[#145b38]">
                          {money(item.unit_price)}
                        </p>
                      </div>
                      <Popconfirm
                        title="Xóa món này khỏi giỏ?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => void remove(item)}
                      >
                        <button
                          type="button"
                          disabled={busyId !== null}
                          aria-label={`Xóa ${item.name}`}
                          className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-40"
                        >
                          <Trash2 size={17} />
                        </button>
                      </Popconfirm>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-[#e5ece0]">
                        <button
                          type="button"
                          aria-label="Giảm"
                          disabled={busyId !== null || item.quantity <= 1}
                          onClick={() =>
                            void changeQuantity(item, item.quantity - 1)
                          }
                          className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Tăng"
                          disabled={busyId !== null || item.quantity >= 99}
                          onClick={() =>
                            void changeQuantity(item, item.quantity + 1)
                          }
                          className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <strong className="text-sm text-[#145b38]">
                        {money(item.unit_price * item.quantity)}
                      </strong>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <aside className="sticky top-24 rounded-2xl border border-[#e5ede1] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#183227]">
              Tóm tắt đơn hàng
            </h2>
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Số lượng</span>
                <span>{totalQuantity} món</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <strong>{money(totalPrice)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phí giao hàng</span>
                <span>Tính khi đặt hàng</span>
              </div>
              <div className="border-t border-[#e5ede1] pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Tổng tạm tính</span>
                  <strong className="text-xl text-[#145b38]">
                    {money(totalPrice)}
                  </strong>
                </div>
              </div>
            </div>
            <Button
              block
              type="primary"
              disabled={
                busyId !== null ||
                items.some((item) => item.available === false)
              }
              onClick={() => setCheckoutOpen(true)}
              className="!mt-6 !h-12 !rounded-xl !bg-[#145b38] !font-bold"
            >
              Tiến hành thanh toán <ArrowRight size={16} />
            </Button>
            <p className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <Truck size={15} /> Số tiền cuối cùng được xác nhận khi đặt hàng.
            </p>
          </aside>
        </div>
      )}
      <Modal
        title="Thông tin giao hàng"
        open={checkoutOpen}
        onCancel={() => {
          if (!ordering) setCheckoutOpen(false);
        }}
        onOk={() => void checkout()}
        okText="Xác nhận đặt hàng"
        cancelText="Quay lại"
        confirmLoading={ordering}
        maskClosable={!ordering}
        closable={!ordering}
        destroyOnHidden
      >
        <p className="mb-5 mt-3 text-sm text-gray-500">
          Kiểm tra thông tin nhận hàng. Phương thức thanh toán: COD.
        </p>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="receiver_name"
            label="Người nhận"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Nhập tên người nhận",
              },
            ]}
          >
            <Input size="large" placeholder="Họ và tên" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Nhập số điện thoại" },
              { pattern: /^0\d{9}$/, message: "Nhập số điện thoại 10 chữ số" },
            ]}
          >
            <Input size="large" maxLength={10} />
          </Form.Item>
          <Form.Item
            name="address"
            label="Địa chỉ giao hàng"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Nhập địa chỉ giao hàng",
              },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
        <div className="flex justify-between rounded-xl bg-[#f2f7ee] p-4 text-sm">
          <span>Tạm tính</span>
          <strong className="text-[#145b38]">{money(totalPrice)}</strong>
        </div>
      </Modal>
    </main>
  );
}
