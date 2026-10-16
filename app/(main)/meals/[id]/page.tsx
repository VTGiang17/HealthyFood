"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { App } from "antd";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Flame,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

import { getMealDetail } from "@/api/meal";
import { addMealToCart } from "@/api/cart";
import type { Meal } from "@/api/admin/meal";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(value)) + "đ";

const roundOne = (value: number) => Math.round(value * 10) / 10;

type MealIngredient = Meal["ingredients"][number];

const getIngredient = (item: MealIngredient) => {
  const value = item.ingredient_id;
  if (typeof value === "string") {
    return { id: value, name: "Nguyên liệu", image: "" };
  }
  return {
    id: value._id,
    name: value.name,
    image:
      "image_url" in value && typeof value.image_url === "string"
        ? value.image_url
        : "",
  };
};

function MealPhoto({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  return src ? (
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-[#eff1e9] text-[#9ba99c]">
      <UtensilsCrossed size={36} strokeWidth={1.25} />
    </div>
  );
}

export default function MealDetailPage() {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setMeal(null);
    setQuantity(1);
    setJustAdded(false);

    getMealDetail(id)
      .then((response) => {
        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.message || "Không tìm thấy món ăn");
        }
        if (active) setMeal(response.data.data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const text = isAxiosError(err)
          ? (err.response?.data as { message?: string } | undefined)?.message
          : err instanceof Error
            ? err.message
            : undefined;
        setError(text || "Không thể tải thông tin món ăn");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const ingredients = useMemo(() => meal?.ingredients ?? [], [meal]);

  const addToCart = async (checkout: boolean) => {
    if (!meal || adding) return;
    setAdding(true);
    try {
      const response = await addMealToCart(meal._id, quantity);
      if (!response.data.success) {
        throw new Error(response.data.message || "Không thể thêm vào giỏ hàng");
      }
      window.dispatchEvent(new Event("cart-updated"));
      setJustAdded(true);
      message.success(`Đã thêm ${quantity} suất vào giỏ hàng`);
      if (checkout) router.push("/cart");
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 401) {
        message.warning("Vui lòng đăng nhập để thêm món vào giỏ hàng");
        router.push(`/login?next=${encodeURIComponent(`/meals/${meal._id}`)}`);
        return;
      }
      const text = isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : err instanceof Error
          ? err.message
          : undefined;
      message.error(text || "Không thể thêm món vào giỏ hàng");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fcfcfa]">
        <div className="mx-auto max-w-[1200px] px-5 py-10 lg:px-8">
          <div className="mb-10 h-4 w-44 animate-pulse rounded bg-[#e9eee7]" />
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="aspect-[5/4] animate-pulse rounded-[22px] bg-[#eef0e9]" />
            <div className="space-y-5 pt-5">
              <div className="h-4 w-24 animate-pulse rounded bg-[#e9eee7]" />
              <div className="h-12 w-4/5 animate-pulse rounded bg-[#e9eee7]" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-[#e9eee7]" />
              <div className="mt-8 h-28 animate-pulse rounded bg-[#f0f2ec]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !meal) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-[#fcfcfa] px-5">
        <div className="max-w-md text-center">
          <UtensilsCrossed
            className="mx-auto mb-5 text-[#99ad9b]"
            size={36}
            strokeWidth={1.2}
          />
          <h1 className="text-2xl font-semibold tracking-tight text-[#22362a]">
            Không thể hiển thị món ăn
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#7b8a7e]">
            {error || "Món ăn hiện không khả dụng."}
          </p>
          <Link
            href="/meals"
            className="mt-7 inline-flex items-center gap-2 border-b border-[#285d3f] pb-1 text-sm font-semibold text-[#285d3f]"
          >
            <ArrowLeft size={15} /> Trở về thực đơn
          </Link>
        </div>
      </main>
    );
  }

  const calories = meal.totals?.calories ?? meal.calories;
  const price = meal.totals?.price;
  const totalPrice = price == null ? null : price * quantity;
  const nutrition = [
    {
      label: "Năng lượng",
      value: calories == null ? "—" : `${Math.round(calories)}`,
      unit: "kcal",
    },
    {
      label: "Chất đạm",
      value:
        meal.totals?.protein == null ? "—" : `${roundOne(meal.totals.protein)}`,
      unit: "g",
    },
    {
      label: "Tinh bột",
      value:
        meal.totals?.carbs == null ? "—" : `${roundOne(meal.totals.carbs)}`,
      unit: "g",
    },
    {
      label: "Chất béo",
      value: meal.totals?.fat == null ? "—" : `${roundOne(meal.totals.fat)}`,
      unit: "g",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fcfcfa] pb-16 text-[#22362a]">
      <div className="mx-auto w-full max-w-[1200px] px-5 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 py-6 text-[12px] text-[#869388] sm:py-8"
        >
          <Link href="/" className="transition hover:text-[#285d3f]">
            Trang chủ
          </Link>
          <ChevronRight size={13} />
          <Link href="/meals" className="transition hover:text-[#285d3f]">
            Thực đơn
          </Link>
          <ChevronRight size={13} />
          <span className="max-w-[50vw] truncate font-medium text-[#334b39]">
            {meal.name}
          </span>
        </nav>

        <div className="grid items-start gap-9 md:gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-[68px]">
          <div className="overflow-hidden rounded-[20px] bg-[#edf1e9] sm:rounded-[24px]">
            <div className="aspect-[5/4] overflow-hidden sm:aspect-[1.14]">
              <MealPhoto
                src={meal.image_url}
                alt={meal.name}
                className="transition-transform duration-700 hover:scale-[1.025]"
              />
            </div>
          </div>

          <section className="lg:pt-2">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-7 bg-[#70977d]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#557c60]">
                Heat & Heart · Healthy meals
              </span>
            </div>

            <h1 className="max-w-[520px] text-[32px] font-semibold leading-[1.18] tracking-[-0.045em] text-[#203829] sm:text-[40px] lg:text-[43px]">
              {meal.name}
            </h1>

            {meal.description && (
              <p className="mt-5 max-w-[460px] text-[14px] leading-[1.9] text-[#718073]">
                {meal.description}
              </p>
            )}

            <div className="mt-7 flex items-baseline justify-between gap-4 border-b border-[#e6ebe3] pb-6">
              <div>
                <p className="mb-1.5 text-[11px] tracking-wide text-[#91a094]">
                  Giá nguyên liệu dự kiến / suất
                </p>
                <p className="text-[30px] font-semibold tracking-[-0.05em] text-[#285d3f] sm:text-[34px]">
                  {price == null ? "Chưa có giá" : formatPrice(price)}
                </p>
              </div>
              {calories != null && (
                <div className="flex items-center gap-1.5 text-[13px] text-[#778579]">
                  {Math.round(calories)} kcal
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="mb-3 text-[12px] font-medium text-[#526657]">
                  Số lượng
                </p>
                <div className="inline-flex h-12 items-center rounded-xl border border-[#dce5da] bg-white">
                  <button
                    type="button"
                    aria-label="Giảm số lượng"
                    disabled={adding || quantity <= 1}
                    onClick={() => {
                      setQuantity((v) => Math.max(1, v - 1));
                      setJustAdded(false);
                    }}
                    className="flex h-full w-12 items-center justify-center text-[#43644c] transition hover:bg-[#f5f8f3] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-11 text-center text-[14px] font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Tăng số lượng"
                    disabled={adding || quantity >= 99}
                    onClick={() => {
                      setQuantity((v) => Math.min(99, v + 1));
                      setJustAdded(false);
                    }}
                    className="flex h-full w-12 items-center justify-center text-[#43644c] transition hover:bg-[#f5f8f3] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {totalPrice != null && (
                <div className="text-right">
                  <p className="mb-1 text-[11px] text-[#91a094]">Tạm tính</p>
                  <p className="text-[18px] font-semibold tracking-tight text-[#284c36]">
                    {formatPrice(totalPrice)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                disabled={adding}
                onClick={() => void addToCart(false)}
                className="inline-flex h-[54px] items-center justify-center gap-2.5 rounded-xl bg-[#285d3f] px-7 text-[13px] font-semibold text-white transition hover:bg-[#1c482e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : justAdded ? (
                  <Check size={17} />
                ) : (
                  <ShoppingBag size={17} />
                )}
                {justAdded ? "Đã thêm vào giỏ" : "Thêm vào giỏ hàng"}
              </button>
              <button
                type="button"
                disabled={adding}
                onClick={() => void addToCart(true)}
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-xl border border-[#cad9cc] bg-white px-6 text-[13px] font-semibold text-[#285d3f] transition hover:border-[#285d3f] hover:bg-[#f6f9f5] disabled:opacity-60"
              >
                Đặt ngay <ArrowRight size={16} />
              </button>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-[#97a39a]">
              Dinh dưỡng và giá được ước tính theo thành phần của một suất. Giá
              khi đặt hàng do hệ thống xác nhận.
            </p>
          </section>
        </div>

        <div className="mt-14 grid gap-10 border-t border-[#e6ebe3] pt-10 sm:mt-20 sm:pt-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-[68px]">
          <section>
            <div className="mb-7">
              <span className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#789781]">
                Trong mỗi suất ăn
              </span>
              <h2 className="mt-2 text-[25px] font-semibold tracking-[-0.04em] text-[#253e2d] sm:text-[29px]">
                Thành phần nguyên liệu
              </h2>
              <p className="mt-2 text-[13px] leading-7 text-[#819083]">
                Nguyên liệu và khối lượng được sử dụng trong món ăn này.
              </p>
            </div>
            {ingredients.length === 0 ? (
              <p className="text-sm text-[#879487]">
                Chưa có thông tin nguyên liệu.
              </p>
            ) : (
              <div className="grid gap-x-7 sm:grid-cols-2">
                {ingredients.map((item, index) => {
                  const ingredient = getIngredient(item);
                  return (
                    <div
                      key={`${ingredient.id}-${index}`}
                      className="flex items-center gap-3.5 border-b border-[#edf0ea] py-3.5"
                    >
                      <div className="h-[62px] w-[62px] shrink-0 overflow-hidden rounded-xl bg-[#f0f3ed]">
                        <MealPhoto
                          src={ingredient.image}
                          alt={ingredient.name}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-[#354d3b]">
                          {ingredient.name}
                        </p>
                        <p className="mt-1 text-[12px] text-[#8b998d]">
                          {item.quantity}g / suất
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="lg:border-l lg:border-[#e6ebe3] lg:pl-10">
            <div className="mb-7">
              <span className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#789781]">
                Thông tin tham khảo
              </span>
              <h2 className="mt-2 text-[25px] font-semibold tracking-[-0.04em] text-[#253e2d] sm:text-[29px]">
                Giá trị dinh dưỡng
              </h2>
              <p className="mt-2 text-[13px] leading-7 text-[#819083]">
                Các chỉ số được tính trên một suất ăn.
              </p>
            </div>
            <div className="border-t border-[#e6ebe3]">
              {nutrition.map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-4 border-b border-[#e6ebe3] py-[18px]"
                >
                  <span className="text-[13px] text-[#6b7b6e]">
                    {item.label}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[20px] font-semibold tracking-[-0.035em] tabular-nums text-[#294a35]">
                      {item.value}
                    </span>
                    {item.value !== "—" && (
                      <span className="text-[12px] text-[#869487]">
                        {item.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/build-bowl"
              className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold text-[#285d3f] transition hover:gap-3"
            >
              Muốn tự điều chỉnh nguyên liệu? <ArrowRight size={16} />
            </Link>
          </section>
        </div>

        <div className="mt-12 border-t border-[#e6ebe3] pt-7 sm:mt-16">
          <Link
            href="/meals"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#587260] transition hover:text-[#285d3f]"
          >
            <ArrowLeft size={16} /> Khám phá thêm món ăn
          </Link>
        </div>
      </div>
    </main>
  );
}
