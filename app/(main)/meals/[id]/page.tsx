"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { App, Button, Empty, InputNumber, Spin, Tabs } from "antd";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  Flame,
  Leaf,
  Minus,
  Plus,
  ShoppingCart,
  Utensils,
} from "lucide-react";
import { getMealDetail } from "@/api/customer";
import { addMealToCart } from "@/api/cart";
import type { Meal } from "@/api/admin/meal";

const money = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";
const idOf = (value: string | { _id: string; name?: string }) =>
  typeof value === "string" ? value : value._id;

export default function MealDetailPage() {
  const { message } = App.useApp();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeImage, setActiveImage] = useState("");

  useEffect(() => {
    let live = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getMealDetail(params.id);
        if (!response.data.success || !response.data.data)
          throw new Error(response.data.message || "Không tìm thấy món ăn");
        if (live) {
          setMeal(response.data.data);
          setActiveImage(response.data.data.image_url || "");
        }
      } catch (e: unknown) {
        if (live)
          setError(
            isAxiosError(e)
              ? (e.response?.data as { message?: string })?.message ||
                  "Không tải được món ăn"
              : e instanceof Error
              ? e.message
              : "Không tải được món ăn"
          );
      } finally {
        if (live) setLoading(false);
      }
    };
    void load();
    return () => {
      live = false;
    };
  }, [params.id]);

  const ingredients = useMemo(() => meal?.ingredients ?? [], [meal]);
  const add = async (goToCart = false) => {
    if (!meal || adding) return;
    setAdding(true);
    try {
      const result = await addMealToCart(meal._id, quantity);
      if (!result.data.success)
        throw new Error(result.data.message || "Thêm giỏ hàng thất bại");
      window.dispatchEvent(new Event("cart-updated"));
      message.success(`Đã thêm ${quantity} suất ${meal.name} vào giỏ`);
      if (goToCart) router.push("/cart");
    } catch (e: unknown) {
      if (isAxiosError(e) && e.response?.status === 401) {
        message.warning("Vui lòng đăng nhập trước khi đặt món");
        router.push(`/login?next=${encodeURIComponent(`/meals/${meal._id}`)}`);
      } else
        message.error(
          isAxiosError(e)
            ? (e.response?.data as { message?: string })?.message ||
                "Thêm giỏ hàng thất bại"
            : e instanceof Error
            ? e.message
            : "Thêm giỏ hàng thất bại"
        );
    } finally {
      setAdding(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  if (!meal || error)
    return (
      <div className="mx-auto max-w-[1100px] px-5 py-20">
        <Empty description={error || "Không tìm thấy món ăn"}>
          <Link href="/meals" className="font-bold text-[#145b38]">
            Quay về thực đơn
          </Link>
        </Empty>
      </div>
    );

  const nutrition = meal.totals;
  const calories = nutrition?.calories ?? meal.calories;
  const price = nutrition?.price;
  return (
    <main className="mx-auto w-full max-w-[1200px] px-5 py-8 lg:px-8">
      <Link
        href="/meals"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#375142] hover:text-[#145b38]"
      >
        <ArrowLeft size={16} /> Quay lại thực đơn
      </Link>
      <div className="grid gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <section>
          <div className="aspect-[1.32] overflow-hidden rounded-2xl bg-[#eef3e9]">
            {activeImage ? (
              <img
                src={activeImage}
                alt={meal.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <Utensils size={56} />
              </div>
            )}
          </div>
          {meal.image_url && (
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setActiveImage(meal.image_url || "")}
                className="h-20 w-24 overflow-hidden rounded-xl border-2 border-[#145b38]"
              >
                <img
                  src={meal.image_url}
                  alt={meal.name}
                  className="h-full w-full object-cover"
                />
              </button>
            </div>
          )}
        </section>
        <section className="py-1">
          <div className="mb-3 flex flex-wrap gap-2">
            {meal.is_recommended && (
              <span className="rounded-full bg-[#e6f3e5] px-3 py-1 text-xs font-bold text-[#145b38]">
                Món đề xuất
              </span>
            )}
            <span className="rounded-full bg-[#f4f6f1] px-3 py-1 text-xs text-gray-600">
              Healthy meal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-[#17271e] lg:text-4xl">
            {meal.name}
          </h1>
          <p className="mt-4 text-3xl font-extrabold text-[#145b38]">
            {price != null ? money(price) : "Chưa có giá"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Giá tính từ nguyên liệu theo Backend
          </p>
          <p className="mt-5 text-sm leading-7 text-gray-600">
            {meal.description ||
              "Một lựa chọn dinh dưỡng cân bằng cho bữa ăn của bạn."}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Calories",
                value: calories == null ? "—" : `${calories} kcal`,
                icon: <Flame size={15} />,
              },
              {
                label: "Protein",
                value:
                  nutrition?.protein == null ? "—" : `${nutrition.protein}g`,
                icon: <Leaf size={15} />,
              },
              {
                label: "Carbs",
                value: nutrition?.carbs == null ? "—" : `${nutrition.carbs}g`,
                icon: <Utensils size={15} />,
              },
              {
                label: "Fat",
                value: nutrition?.fat == null ? "—" : `${nutrition.fat}g`,
                icon: <Utensils size={15} />,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-[#f3f8f1] p-3 text-center"
              >
                <div className="mb-1 flex justify-center text-[#16834b]">
                  {stat.icon}
                </div>
                <p className="text-sm font-extrabold text-[#203729]">
                  {stat.value}
                </p>
                <p className="text-[10px] text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <label className="mb-2 block text-xs font-bold text-gray-600">
              Số lượng
            </label>
            <div className="inline-flex items-center rounded-lg border border-[#e5ebdf]">
              <button
                aria-label="Giảm"
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                className="flex h-10 w-10 items-center justify-center disabled:opacity-40"
              >
                <Minus size={15} />
              </button>
              <InputNumber
                min={1}
                max={99}
                value={quantity}
                controls={false}
                onChange={(v) => setQuantity(Math.min(99, Math.max(1, v || 1)))}
                className="!w-14 !border-0 text-center"
              />
              <button
                aria-label="Tăng"
                type="button"
                disabled={quantity >= 99}
                onClick={() => setQuantity((v) => Math.min(99, v + 1))}
                className="flex h-10 w-10 items-center justify-center disabled:opacity-40"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button
              loading={adding}
              type="primary"
              onClick={() => void add(false)}
              className="!h-12 !rounded-xl !bg-[#145b38] !font-bold"
            >
              <ShoppingCart size={16} /> Thêm vào giỏ hàng
            </Button>
            <Button
              disabled={adding}
              onClick={() => void add(true)}
              className="!h-12 !rounded-xl !border-[#145b38] !font-bold !text-[#145b38]"
            >
              Đặt ngay <Plus size={16} />
            </Button>
          </div>
        </section>
      </div>
      <section className="mt-10 rounded-2xl border border-[#e9eee7] bg-white p-5 sm:p-7">
        <Tabs
          items={[
            {
              key: "ingredients",
              label: "Thành phần",
              children: (
                <div>
                  <p className="mb-4 text-sm text-gray-500">
                    Nguyên liệu và định lượng trong một phần ăn.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {ingredients.map((i, index) => (
                      <div
                        key={`${idOf(i.ingredient_id)}-${index}`}
                        className="flex items-center gap-3 rounded-xl bg-[#f7f9f5] p-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4eee0] text-[#145b38]">
                          <Leaf size={17} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#23392c]">
                            {typeof i.ingredient_id === "string"
                              ? `Nguyên liệu ${index + 1}`
                              : i.ingredient_id.name}
                          </p>
                          <p className="text-xs text-gray-500">{i.quantity}g</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: "nutrition",
              label: "Thông tin dinh dưỡng",
              children: (
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  {[
                    ["Calories", calories == null ? "—" : `${calories} kcal`],
                    [
                      "Protein",
                      nutrition?.protein == null
                        ? "—"
                        : `${nutrition.protein}g`,
                    ],
                    [
                      "Carbs",
                      nutrition?.carbs == null ? "—" : `${nutrition.carbs}g`,
                    ],
                    [
                      "Chất béo",
                      nutrition?.fat == null ? "—" : `${nutrition.fat}g`,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between border-b border-[#edf0eb] py-3"
                    >
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              key: "description",
              label: "Mô tả",
              children: (
                <p className="text-sm leading-7 text-gray-600">
                  {meal.description || "Chưa có mô tả chi tiết."}
                </p>
              ),
            },
          ]}
        />
      </section>
    </main>
  );
}
