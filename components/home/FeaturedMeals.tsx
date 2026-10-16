"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { ArrowRight, Check, Loader2, Plus } from "lucide-react";
import { App } from "antd";

import { getRecommendedMeals, type Meal } from "@/api/meal";

import { addMealToCart } from "@/api/cart";

const container = "mx-auto w-full max-w-[1200px] px-5 lg:px-8";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";

export default function FeaturedMeals() {
  const { message } = App.useApp();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addingIds, setAddingIds] = useState<string[]>([]);

  const [addedIds, setAddedIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchRecommendedMeals = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getRecommendedMeals();

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Không thể lấy món ăn đề xuất",
          );
        }

        const data = response.data.data;

        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu món ăn không đúng định dạng");
        }

        if (!cancelled) {
          setMeals(
            data
              .filter((meal) => meal.is_active && meal.is_recommended)
              .slice(0, 4),
          );
        }
      } catch (err) {
        console.error("Get recommended meals error:", err);

        if (!cancelled) {
          setError("Không thể tải món ăn nổi bật");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchRecommendedMeals();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddToCart = async (meal: Meal) => {
    if (addingIds.includes(meal._id)) {
      return;
    }

    try {
      setAddingIds((prev) => [...prev, meal._id]);

      const response = await addMealToCart(meal._id, 1);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Không thể thêm món ăn vào giỏ hàng",
        );
      }

      window.dispatchEvent(new Event("cart-updated"));

      setAddedIds((prev) =>
        prev.includes(meal._id) ? prev : [...prev, meal._id],
      );

      message.success(`Đã thêm "${meal.name}" vào giỏ hàng`);
    } catch (err: unknown) {
      console.error("Add to cart error:", err);

      if (isAxiosError(err) && err.response?.status === 401) {
        message.warning("Vui lòng đăng nhập để thêm món vào giỏ hàng");
        return;
      }

      if (isAxiosError(err)) {
        const errorMessage =
          (
            err.response?.data as {
              message?: string;
            }
          )?.message || "Không thể thêm món vào giỏ hàng";

        message.error(errorMessage);
        return;
      }

      message.error(
        err instanceof Error ? err.message : "Không thể thêm món vào giỏ hàng",
      );
    } finally {
      setAddingIds((prev) => prev.filter((id) => id !== meal._id));
    }
  };

  return (
    <section className="bg-white py-12 lg:py-14">
      <div className={container}>
        {/* TIÊU ĐỀ */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[27px] font-extrabold tracking-[-0.03em] text-[#17271e] sm:text-[30px]">
              Món ăn nổi bật
            </h2>

            <p className="mt-1.5 text-[12px] text-gray-500">
              Những phần cơm healthy được đề xuất
            </p>
          </div>

          <Link
            href="/meals"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#145b38] hover:underline"
          >
            Xem tất cả
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* ĐANG TẢI */}
        {loading && (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-100"
              >
                <div className="aspect-[1.4] bg-gray-100" />

                <div className="space-y-3 p-4">
                  <div className="h-4 w-4/5 rounded bg-gray-100" />
                  <div className="h-3 w-1/2 rounded bg-gray-100" />
                  <div className="h-5 w-1/3 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LỖI */}
        {!loading && error && (
          <div className="rounded-xl bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
            {error}
          </div>
        )}

        {/* CHƯA CÓ MÓN ĂN */}
        {!loading && !error && meals.length === 0 && (
          <div className="rounded-xl bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
            Chưa có món ăn nào được đề xuất.
          </div>
        )}

        {/* DANH SÁCH MÓN */}
        {!loading && !error && meals.length > 0 && (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
            {meals.map((meal) => {
              const calories = meal.calories ?? meal.totals?.calories;

              const price = meal.totals?.price;

              const isAdding = addingIds.includes(meal._id);

              const isAdded = addedIds.includes(meal._id);

              return (
                <article
                  key={meal._id}
                  className="group overflow-hidden rounded-2xl border border-[#edf0eb] bg-white shadow-[0_5px_18px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* ẢNH - CLICK ĐỂ XEM CHI TIẾT */}
                  <Link
                    href={`/meals/${meal._id}`}
                    className="relative block aspect-[1.4] overflow-hidden bg-[#edf3e9]"
                  >
                    {meal.image_url ? (
                      <img
                        src={meal.image_url}
                        alt={meal.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        Chưa có ảnh
                      </div>
                    )}

                    <span className="absolute left-2.5 top-2.5 rounded-md bg-[#17834c] px-2.5 py-1 text-[10px] font-bold text-white">
                      Đề xuất
                    </span>
                  </Link>

                  {/* THÔNG TIN */}
                  <div className="p-3 sm:p-4">
                    <Link href={`/meals/${meal._id}`} className="block">
                      <h3 className="line-clamp-1 text-[12px] font-semibold text-[#182a20] transition-colors hover:text-[#16834b] sm:text-[13px]">
                        {meal.name}
                      </h3>
                    </Link>

                    <p className="mt-1 text-[11px] text-gray-400">
                      {calories != null
                        ? `${calories} kcal`
                        : "Chưa có Calories"}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[14px] font-extrabold text-[#145b38] sm:text-[15px]">
                        {price != null ? formatPrice(price) : "Chưa có giá"}
                      </span>

                      {/* NÚT THÊM GIỎ HÀNG */}
                      <button
                        type="button"
                        disabled={isAdding}
                        onClick={() => void handleAddToCart(meal)}
                        aria-label={`Thêm ${meal.name} vào giỏ hàng`}
                        title={isAdding ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#145b38] text-white transition hover:bg-[#0d462b] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isAdding ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : isAdded ? (
                          <Check size={17} />
                        ) : (
                          <Plus size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
