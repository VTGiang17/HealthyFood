"use client";

import Link from "next/link";
import { Button, Drawer, Empty } from "antd";
import {
  ArrowRight,
  Flame,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

export type CartItem = {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  calories?: number;
};

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onQuantityChange: (id: CartItem["id"], quantity: number) => void;
  onRemove: (id: CartItem["id"]) => void;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";

export default function CartDrawer({
  open,
  onClose,
  items,
  onQuantityChange,
  onRemove,
}: CartDrawerProps) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
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
        body: { padding: 0, display: "flex", flexDirection: "column" },
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

            <Link
              href="/cart"
              onClick={onClose}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#145b38] text-[13px] font-bold text-white transition hover:bg-[#0d462b]"
            >
              Xem giỏ hàng chi tiết
              <ArrowRight size={16} />
            </Link>

            <Button
              block
              shape="round"
              size="large"
              onClick={onClose}
              className="!h-10 !text-[12px] !font-bold"
            >
              Tiếp tục chọn món
            </Button>
          </div>
        ) : null
      }
    >
      {items.length === 0 ? (
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
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#145b38] px-5 text-[12px] font-bold text-white transition hover:bg-[#0d462b]"
            >
              Xem thực đơn <ArrowRight size={15} />
            </Link>
          </Empty>
        </div>
      ) : (
        <ul className="divide-y divide-[#f0f3ee] px-5">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 py-4">
              <img
                src={item.image}
                alt={item.name}
                className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
              />

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-[13px] font-bold leading-5 text-[#182a20]">
                    {item.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Xóa ${item.name}`}
                    className="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {item.calories !== undefined && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                    <Flame size={11} className="text-orange-500" />
                    {item.calories} kcal
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-[#e3eadf]">
                    <button
                      type="button"
                      onClick={() =>
                        onQuantityChange(
                          item.id,
                          Math.max(1, item.quantity - 1)
                        )
                      }
                      disabled={item.quantity <= 1}
                      aria-label="Giảm số lượng"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[#145b38] transition hover:bg-[#f1f5ef] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-[12px] font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onQuantityChange(item.id, item.quantity + 1)
                      }
                      aria-label="Tăng số lượng"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[#145b38] transition hover:bg-[#f1f5ef]"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <span className="text-[14px] font-extrabold text-[#145b38]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
