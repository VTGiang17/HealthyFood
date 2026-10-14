"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";

import {
  App,
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Spin,
} from "antd";

import {
  ArrowRight,
  Flame,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import {
  getCart,
  updateCartQuantity,
  removeCartItem,
  type CartItem,
} from "@/api/cart";

import { createOrder, type CreateOrderPayload } from "@/api/order";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type CheckoutFormValues = {
  receiver_name: string;
  phone: string;
  address: string;
  note?: string;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)
      ?.message;

    if (error.response?.status === 401) {
      return "Vui lòng đăng nhập để sử dụng giỏ hàng";
    }

    return message || "Có lỗi xảy ra, vui lòng thử lại";
  }

  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra, vui lòng thử lại";
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { message } = App.useApp();

  const [form] = Form.useForm<CheckoutFormValues>();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);

  // =========================================
  // 1. LẤY GIỎ HÀNG TỪ BACKEND
  // =========================================
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getCart();

      if (!response.data.success) {
        throw new Error(response.data.message || "Không thể tải giỏ hàng");
      }

      setItems(response.data.data?.items ?? []);
    } catch (error) {
      setItems([]);

      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [message]);

  // Khi mở Drawer, lấy dữ liệu mới nhất
  useEffect(() => {
    if (open) {
      void fetchCart();
    }
  }, [open, fetchCart]);

  // Đồng bộ khi thêm món từ trang chủ
  useEffect(() => {
    const handleCartUpdated = () => {
      if (open) {
        void fetchCart();
      }
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, [open, fetchCart]);

  // =========================================
  // 2. TÍNH TỔNG GIỎ HÀNG
  // =========================================
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  // =========================================
  // 3. CẬP NHẬT SỐ LƯỢNG
  // =========================================
  const handleQuantityChange = async (item: CartItem, quantity: number) => {
    if (updatingId || quantity < 1 || quantity > 99) {
      return;
    }

    try {
      setUpdatingId(item._id);

      const response = await updateCartQuantity(item._id, quantity);

      if (!response.data.success) {
        throw new Error(response.data.message || "Không thể cập nhật số lượng");
      }

      await fetchCart();

      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================================
  // 4. XÓA MỘT MÓN KHỎI GIỎ
  // =========================================
  const handleRemove = async (item: CartItem) => {
    if (updatingId) return;

    try {
      setUpdatingId(item._id);

      const response = await removeCartItem(item._id);

      if (!response.data.success) {
        throw new Error(response.data.message || "Không thể xóa món ăn");
      }

      message.success(`Đã xóa "${item.name}" khỏi giỏ hàng`);

      await fetchCart();

      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================================
  // 5. TẠO ĐƠN HÀNG
  // =========================================
  const handleCheckout = async () => {
    if (ordering) return;

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

      // Backend sẽ:
      // 1. Đọc giỏ hàng
      // 2. Kiểm tra món và tính lại tổng tiền
      // 3. Tạo đơn hàng
      // 4. Xóa các món trong giỏ sau khi thành công
      const response = await createOrder(payload);

      if (!response.data.success) {
        throw new Error(response.data.message || "Không thể tạo đơn hàng");
      }

      // Không gọi DELETE /api/cart ở đây
      setItems([]);

      setCheckoutOpen(false);
      form.resetFields();

      window.dispatchEvent(new Event("cart-updated"));

      message.success("Đặt hàng thành công! Đơn hàng của bạn đã được tạo.", 5);

      onClose();
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      message.error(getErrorMessage(error));
    } finally {
      setOrdering(false);
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        placement="right"
        width="min(420px, 100vw)"
        title={
          <div className="flex items-center gap-2 text-[#183227]">
            <ShoppingBag size={20} className="text-[#16834b]" />

            <span className="text-[16px] font-extrabold">Giỏ hàng</span>

            {totalQuantity > 0 && (
              <span className="rounded-full bg-[#e8f2e4] px-2 py-0.5 text-[11px] font-bold text-[#145b38]">
                {totalQuantity} món
              </span>
            )}
          </div>
        }
        styles={{
          body: {
            padding: 0,
            display: "flex",
            flexDirection: "column",
          },
          footer: { padding: 0 },
        }}
        footer={
          items.length > 0 ? (
            <div className="space-y-3 border-t border-[#edf0eb] bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-500">Tạm tính</span>

                <span className="text-[18px] font-extrabold text-[#145b38]">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <p className="text-[11px] text-gray-400">
                Phí giao hàng sẽ được tính ở bước thanh toán.
              </p>

              {/* NÚT TẠO ĐƠN HÀNG */}
              <Button
                type="primary"
                block
                size="large"
                shape="round"
                disabled={
                  loading ||
                  ordering ||
                  updatingId !== null ||
                  items.some((item) => item.available === false)
                }
                onClick={() => setCheckoutOpen(true)}
                className="!h-11 !font-bold"
              >
                Tiến hành đặt hàng
                <ArrowRight size={16} />
              </Button>

              <Link
                href="/cart"
                onClick={onClose}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#e3eadf] text-[12px] font-bold text-[#145b38] hover:bg-[#f4f8f2]"
              >
                Xem giỏ hàng chi tiết
              </Link>

              <Button
                block
                shape="round"
                onClick={onClose}
                className="!h-10 !text-[12px] !font-bold"
              >
                Tiếp tục chọn món
              </Button>
            </div>
          ) : null
        }
      >
        {/* LOADING */}
        {loading && items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          /* GIỎ HÀNG TRỐNG */
          <div className="flex flex-1 items-center justify-center px-6">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-[13px] text-gray-500">
                  Giỏ hàng của bạn đang trống
                </span>
              }
            >
              <Link
                href="/meals"
                onClick={onClose}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#145b38] px-5 text-[12px] font-bold text-white hover:bg-[#0d462b]"
              >
                Xem thực đơn
                <ArrowRight size={15} />
              </Link>
            </Empty>
          </div>
        ) : (
          /* DANH SÁCH MÓN */
          <ul className="divide-y divide-[#f0f3ee] px-5">
            {items.map((item) => (
              <li key={item._id} className="flex gap-3 py-4">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl bg-[#edf3e9]">
                    <ShoppingBag size={23} className="text-[#16834b]" />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-[13px] font-bold leading-5 text-[#182a20]">
                      {item.name}
                    </h3>

                    <Popconfirm
                      title="Xóa món khỏi giỏ hàng?"
                      description={item.name}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleRemove(item)}
                    >
                      <button
                        type="button"
                        disabled={updatingId !== null}
                        aria-label={`Xóa ${item.name}`}
                        className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </Popconfirm>
                  </div>

                  {item.nutrition?.calories != null && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                      <Flame size={11} className="text-orange-500" />
                      {item.nutrition.calories} kcal
                    </p>
                  )}

                  {item.available === false && (
                    <p className="mt-1 text-xs text-red-500">
                      {item.error || "Món ăn hiện không khả dụng"}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-full border border-[#e3eadf]">
                      <button
                        type="button"
                        disabled={updatingId !== null || item.quantity <= 1}
                        onClick={() =>
                          handleQuantityChange(item, item.quantity - 1)
                        }
                        aria-label="Giảm số lượng"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[#145b38] hover:bg-[#f1f5ef] disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="w-7 text-center text-[12px] font-bold">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        disabled={updatingId !== null || item.quantity >= 99}
                        onClick={() =>
                          handleQuantityChange(item, item.quantity + 1)
                        }
                        aria-label="Tăng số lượng"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[#145b38] hover:bg-[#f1f5ef] disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span className="text-[14px] font-extrabold text-[#145b38]">
                      {formatPrice(item.unit_price * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      {/* FORM ĐẶT HÀNG */}
      <Modal
        title="Thông tin đặt hàng"
        open={checkoutOpen}
        onCancel={() => {
          if (!ordering) {
            setCheckoutOpen(false);
          }
        }}
        onOk={handleCheckout}
        okText="Xác nhận đặt hàng"
        cancelText="Quay lại"
        confirmLoading={ordering}
        okButtonProps={{
          disabled: items.length === 0 || updatingId !== null,
        }}
        closable={!ordering}
        maskClosable={!ordering}
        width={560}
        destroyOnHidden
      >
        <p className="mb-5 mt-3 text-sm text-gray-500">
          Vui lòng nhập thông tin người nhận để hoàn tất đơn hàng.
        </p>

        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="receiver_name"
            label="Họ tên người nhận"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập họ tên",
              },
            ]}
          >
            <Input size="large" placeholder="Nhập họ tên người nhận" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập số điện thoại",
              },
              {
                pattern: /^0\d{9}$/,
                message: "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0",
              },
            ]}
          >
            <Input
              size="large"
              maxLength={10}
              placeholder="Ví dụ: 0901234567"
            />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ giao hàng"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập địa chỉ giao hàng",
              },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Số nhà, tên đường, phường/xã, tỉnh/thành phố"
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú (không bắt buộc)">
            <Input.TextArea
              rows={2}
              placeholder="Ví dụ: Ít cay, giao trước 12 giờ..."
            />
          </Form.Item>

          <div className="rounded-xl bg-[#f3f8f1] p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Số lượng</span>
              <strong>{totalQuantity} món</strong>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Tạm tính</span>
              <strong className="text-[#145b38]">
                {formatPrice(totalPrice)}
              </strong>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Thanh toán khi nhận hàng (COD). Số tiền chính thức được Backend
              xác nhận khi tạo đơn hàng.
            </p>
          </div>
        </Form>
      </Modal>
    </>
  );
}
