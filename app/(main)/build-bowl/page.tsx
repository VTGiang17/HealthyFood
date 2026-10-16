"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Spin } from "antd";
import { isAxiosError } from "axios";
import {
  ArrowRight,
  Check,
  ChefHat,
  Flame,
  Leaf,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import { get } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";
import { getIngredients, type Ingredient } from "@/api/admin/ingredient";
import { addCustomBowlToCart } from "@/api/customBowlCart";

type Category = { _id: string; name: string; is_active?: boolean };
type Selected = Record<string, number>;
type NutritionKey = "protein" | "carbs" | "fat";

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("vi-VN").format(Math.round(value))}đ`;
const round = (value: number) => Math.round(value * 10) / 10;
const idOf = (value: string | { _id: string } | undefined) =>
  typeof value === "string" ? value : (value?._id ?? "");

function readList<T>(input: unknown, key: string): T[] {
  if (Array.isArray(input)) return input as T[];
  if (input && typeof input === "object") {
    const value = input as Record<string, unknown>;
    if (Array.isArray(value[key])) return value[key] as T[];
    if ("data" in value) return readList<T>(value.data, key);
  }
  return [];
}

function quantityRule(ingredient: Ingredient) {
  const step = ingredient.step_grams > 0 ? ingredient.step_grams : 10;
  const min = ingredient.min_grams > 0 ? ingredient.min_grams : step;
  const max = Math.max(min, ingredient.max_grams || min);
  return { min, max, step };
}

function getApiError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 401)
      return "Vui lòng đăng nhập để thêm vào giỏ hàng";
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || "Không thể kết nối đến máy chủ";
  }
  return error instanceof Error ? error.message : "Có lỗi xảy ra";
}

export default function BuildBowlPage() {
  const { message } = App.useApp();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Selected>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const [ingredientRes, categoryRes] = await Promise.all([
        getIngredients(),
        get<{ success: boolean; data: unknown }>(API_PATH.CATEGORY.LIST),
      ]);
      if (!ingredientRes.data.success || !categoryRes.data.success) {
        throw new Error("Không tải được danh sách nguyên liệu hoặc danh mục");
      }
      const ingredientData = readList<Ingredient>(
        ingredientRes.data.data,
        "ingredients",
      );
      const categoryData = readList<Category>(
        categoryRes.data.data,
        "categories",
      );
      setIngredients(ingredientData.filter((item) => item.is_active));
      setCategories(categoryData.filter((item) => item.is_active !== false));
    } catch (error) {
      console.error("Build bowl fetch error:", error);
      setLoadError(getApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ingredient of ingredients) {
      const key = idOf(ingredient.category_id);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [ingredients]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi-VN");
    return ingredients.filter((ingredient) => {
      const matchesCategory =
        activeCategory === "all" ||
        idOf(ingredient.category_id) === activeCategory;
      return (
        matchesCategory &&
        (!keyword ||
          ingredient.name.toLocaleLowerCase("vi-VN").includes(keyword))
      );
    });
  }, [ingredients, activeCategory, search]);

  const selectedIngredients = useMemo(
    () =>
      ingredients.filter((ingredient) => (selected[ingredient._id] ?? 0) > 0),
    [ingredients, selected],
  );

  const totals = useMemo(() => {
    return selectedIngredients.reduce(
      (result, ingredient) => {
        const grams = selected[ingredient._id] ?? 0;
        const ratio = grams / 100;
        result.weight += grams;
        result.calories += (ingredient.nutrition?.calories ?? 0) * ratio;
        result.protein += (ingredient.nutrition?.protein ?? 0) * ratio;
        result.carbs += (ingredient.nutrition?.carbs ?? 0) * ratio;
        result.fat += (ingredient.nutrition?.fat ?? 0) * ratio;
        result.price += ingredient.price_per_100g * ratio;
        return result;
      },
      { weight: 0, calories: 0, protein: 0, carbs: 0, fat: 0, price: 0 },
    );
  }, [selected, selectedIngredients]);

  const changeQuantity = (ingredient: Ingredient, direction: -1 | 1) => {
    const { min, max, step } = quantityRule(ingredient);
    setSelected((previous) => {
      const current = previous[ingredient._id] ?? 0;
      let next = current;
      if (direction === 1) {
        if (current === 0) next = min;
        else if (current + step <= max) next = current + step;
      } else if (current <= min) {
        next = 0;
      } else {
        next = Math.max(min, current - step);
      }
      if (next === current) return previous;
      const updated = { ...previous };
      if (next === 0) delete updated[ingredient._id];
      else updated[ingredient._id] = next;
      return updated;
    });
  };

  const addToCart = async () => {
    if (adding || selectedIngredients.length === 0) return;
    try {
      setAdding(true);
      const data = selectedIngredients.map((ingredient) => ({
        ingredient_id: ingredient._id,
        quantity: selected[ingredient._id],
      }));
      const response = await addCustomBowlToCart(data, 1);
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Không thể thêm suất ăn vào giỏ",
        );
      }
      window.dispatchEvent(new Event("cart-updated"));
      message.success("Đã thêm suất ăn tự thiết kế vào giỏ hàng");
    } catch (error) {
      message.error(getApiError(error));
    } finally {
      setAdding(false);
    }
  };

  const nutritionRows: { label: string; key: NutritionKey; color: string }[] = [
    { label: "Protein", key: "protein", color: "#2e8b61" },
    { label: "Carbs", key: "carbs", color: "#e9a35b" },
    { label: "Fat", key: "fat", color: "#ed8172" },
  ];
  const macroSum = totals.protein + totals.carbs + totals.fat;
  const greenPct = macroSum ? (totals.protein / macroSum) * 100 : 0;
  const orangePct = macroSum
    ? ((totals.protein + totals.carbs) / macroSum) * 100
    : 0;

  return (
    <main className="min-h-screen bg-[#f7f9f6] pb-16 text-[#172c21]">
      <div className="mx-auto max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        {/* <div className="relative overflow-hidden rounded-[28px] bg-[#eaf2e8] px-6 py-7 sm:px-9 sm:py-9">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-[#d1e5ce]/70 blur-2xl" />
          <div className="pointer-events-none absolute bottom-[-100px] right-44 h-48 w-48 rounded-full bg-white/60 blur-2xl" />
          <div className="relative max-w-[680px]">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#2a7850]">
              <Sparkles size={13} /> Build your bowl
            </p>
            <h1 className="text-[29px] font-extrabold leading-tight tracking-[-0.045em] sm:text-[38px]">
              Một bữa ăn, <span className="text-[#218050]">đúng ý bạn.</span>
            </h1>
            <p className="mt-3 max-w-[570px] text-[13px] leading-7 text-[#637468] sm:text-sm">
              Chọn nguyên liệu, điều chỉnh khẩu phần và theo dõi dinh dưỡng theo
              từng gram. Mọi thứ được cá nhân hóa theo nhu cầu của bạn.
            </p>
          </div>
          <div className="relative mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#3c654b]">
              <Leaf size={13} /> Nguyên liệu tươi
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#3c654b]">
              <SlidersHorizontal size={13} /> Chọn số gram
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#3c654b]">
              <Flame size={13} /> Dinh dưỡng tức thì
            </span>
          </div>
        </div> */}

        {loading ? (
          <div className="flex min-h-[380px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : loadError ? (
          <div className="mt-6 rounded-2xl border border-red-100 bg-white px-6 py-10 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <button
              onClick={() => void fetchData()}
              className="mt-4 rounded-full bg-[#145b38] px-5 py-2 text-xs font-bold text-white"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)_minmax(260px,0.72fr)]">
            {/* 1. CHỌN NGUYÊN LIỆU */}
            <section className="overflow-hidden rounded-[22px] border border-[#e8eee7] bg-white shadow-[0_6px_30px_rgba(20,70,35,0.035)]">
              <div className="border-b border-[#edf1ec] px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#87a08a]">
                      Bước 01
                    </p>
                    <h2 className="mt-1 text-[17px] font-extrabold">
                      Chọn nguyên liệu
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#f1f7ee] px-3 py-1.5 text-[11px] font-bold text-[#397451]">
                    {ingredients.length} nguyên liệu
                  </span>
                </div>
                <div className="relative mt-4">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98a59a]"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm nguyên liệu yêu thích..."
                    className="h-11 w-full rounded-xl border border-[#e8ede7] bg-[#fafcf9] pl-10 pr-4 text-[13px] text-[#172c21] outline-none transition focus:border-[#8bb89a] focus:bg-white"
                  />
                </div>
              </div>
              <div className="border-b border-[#edf1ec] px-4 py-4 sm:px-5">
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition ${activeCategory === "all" ? "bg-[#145b38] text-white" : "bg-[#f3f6f2] text-[#56675b] hover:bg-[#e7eee6]"}`}
                  >
                    Tất cả{" "}
                    <span className="ml-1 opacity-70">
                      {ingredients.length}
                    </span>
                  </button>
                  {categories.map((item) => (
                    <button
                      type="button"
                      key={item._id}
                      onClick={() => setActiveCategory(item._id)}
                      className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition ${activeCategory === item._id ? "bg-[#145b38] text-white" : "bg-[#f3f6f2] text-[#56675b] hover:bg-[#e7eee6]"}`}
                    >
                      {item.name}{" "}
                      <span className="ml-1 opacity-65">
                        {categoryCounts.get(item._id) ?? 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-[690px] divide-y divide-[#edf1ec] overflow-y-auto [scrollbar-width:thin]">
                {filtered.length === 0 ? (
                  <div className="px-5 py-16 text-center">
                    <UtensilsCrossed
                      size={28}
                      className="mx-auto text-[#bbcbb9]"
                    />
                    <p className="mt-3 text-sm font-semibold text-[#425847]">
                      Không tìm thấy nguyên liệu
                    </p>
                    <p className="mt-1 text-xs text-[#8a9a8b]">
                      Hãy thử một danh mục hoặc từ khóa khác.
                    </p>
                  </div>
                ) : (
                  filtered.map((ingredient) => {
                    const quantity = selected[ingredient._id] ?? 0;
                    const { min, max, step } = quantityRule(ingredient);
                    const isSelected = quantity > 0;
                    return (
                      <div
                        key={ingredient._id}
                        className={`flex gap-3 px-4 py-4 transition sm:px-5 ${isSelected ? "bg-[#fcfefb]" : "hover:bg-[#fbfdf9]"}`}
                      >
                        <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl bg-[#eef4eb] sm:h-[88px] sm:w-[88px]">
                          {ingredient.image_url ? (
                            <img
                              src={ingredient.image_url}
                              alt={ingredient.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#9ab69d]">
                              <Wheat size={28} />
                            </div>
                          )}
                          {isSelected && (
                            <span className="absolute right-1.5 top-1.5 rounded-full bg-[#188050] p-1 text-white">
                              <Check size={11} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                          <div>
                            <h3 className="line-clamp-1 text-[13px] font-bold sm:text-sm">
                              {ingredient.name}
                            </h3>
                            <p className="mt-1 text-[11px] text-[#95a095]">
                              {round(ingredient.nutrition?.calories ?? 0)} kcal
                              / 100g
                            </p>
                            <p className="mt-1 text-[12px] font-extrabold text-[#218050]">
                              {formatPrice(ingredient.price_per_100g)}{" "}
                              <span className="text-[10px] font-normal text-[#9ba89d]">
                                / 100g
                              </span>
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] text-[#9aa79b]">
                              {min}–{max}g · bước {step}g
                            </span>
                            <div className="flex h-8 items-center overflow-hidden rounded-full border border-[#dce8da] bg-white">
                              <button
                                type="button"
                                onClick={() => changeQuantity(ingredient, -1)}
                                disabled={!isSelected}
                                aria-label={`Giảm ${ingredient.name}`}
                                className="flex h-8 w-8 items-center justify-center text-[#246c46] hover:bg-[#edf5eb] disabled:opacity-30"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="min-w-[44px] text-center text-[11px] font-bold tabular-nums">
                                {quantity}g
                              </span>
                              <button
                                type="button"
                                onClick={() => changeQuantity(ingredient, 1)}
                                disabled={quantity >= max}
                                aria-label={`Tăng ${ingredient.name}`}
                                className="flex h-8 w-8 items-center justify-center text-[#246c46] hover:bg-[#edf5eb] disabled:opacity-30"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* 2. SUẤT ĂN ĐANG THIẾT KẾ */}
            <section className="overflow-hidden rounded-[22px] border border-[#e8eee7] bg-white shadow-[0_6px_30px_rgba(20,70,35,0.035)]">
              <div className="flex items-center justify-between border-b border-[#edf1ec] px-5 py-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#87a08a]">
                    Bước 02
                  </p>
                  <h2 className="mt-1 text-[17px] font-extrabold">
                    Suất ăn của bạn
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected({})}
                  disabled={selectedIngredients.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#dde8db] px-3 py-2 text-[11px] font-bold text-[#397451] hover:bg-[#f5f9f3] disabled:opacity-40"
                >
                  <RotateCcw size={13} /> Đặt lại
                </button>
              </div>
              <div className="px-5 pt-5">
                <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#eff5ea] via-[#f6f8ee] to-[#e5efe3] px-4 py-5">
                  <div className="pointer-events-none absolute -right-5 -top-8 h-28 w-28 rounded-full bg-white/50 blur-xl" />
                  <div className="relative mx-auto flex min-h-[154px] max-w-[330px] flex-col items-center justify-center">
                    {selectedIngredients.length === 0 ? (
                      <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#529069] shadow-sm">
                          <ChefHat size={29} />
                        </div>
                        <p className="mt-3 text-[12px] font-semibold text-[#57765e]">
                          Suất ăn đang chờ bạn thiết kế
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center -space-x-4">
                          {selectedIngredients.slice(0, 5).map((ingredient) => (
                            <div
                              key={ingredient._id}
                              className="h-[74px] w-[74px] overflow-hidden rounded-full border-[4px] border-white bg-[#e3efe0] shadow-md"
                            >
                              {ingredient.image_url ? (
                                <img
                                  src={ingredient.image_url}
                                  alt={ingredient.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#5e976c]">
                                  <Leaf size={22} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-[23px] font-extrabold tabular-nums">
                          {round(totals.weight)}g
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-[#66826b]">
                          {selectedIngredients.length} nguyên liệu đã chọn
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between text-[12px]">
                  <h3 className="font-bold">Thành phần đã chọn</h3>
                  <span className="text-[#899d8c]">
                    {selectedIngredients.length} loại
                  </span>
                </div>
                <div className="mt-2 min-h-[120px] divide-y divide-[#eef1eb]">
                  {selectedIngredients.length === 0 ? (
                    <p className="py-10 text-center text-[12px] leading-6 text-[#9aa99d]">
                      Nhấn dấu <strong>+</strong> ở danh sách nguyên liệu để bắt
                      đầu.
                    </p>
                  ) : (
                    selectedIngredients.map((ingredient) => (
                      <div
                        key={ingredient._id}
                        className="flex items-center gap-3 py-3"
                      >
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#edf3e9]">
                          {ingredient.image_url ? (
                            <img
                              src={ingredient.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Leaf size={16} className="m-2 text-[#609a74]" />
                          )}
                        </div>
                        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                          {ingredient.name}
                        </span>
                        <span className="text-[11px] font-bold tabular-nums text-[#42654b]">
                          {selected[ingredient._id]}g
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(ingredient, -1)}
                          aria-label={`Giảm ${ingredient.name}`}
                          className="rounded-full p-1 text-[#8b9b8e] hover:bg-[#f1f6ef] hover:text-[#145b38]"
                        >
                          <Minus size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3 flex items-end justify-between border-t border-dashed border-[#dce6d9] py-5">
                  <div>
                    <p className="text-[12px] text-[#75877a]">
                      Giá nguyên liệu dự kiến
                    </p>
                    <p className="mt-1 text-[10px] text-[#a0aca2]">
                      Giá được tính theo gram đã chọn
                    </p>
                  </div>
                  <strong className="text-[24px] font-extrabold tracking-[-0.03em] text-[#145b38]">
                    {formatPrice(totals.price)}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => void addToCart()}
                  disabled={selectedIngredients.length === 0 || adding}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#145b38] text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(20,91,56,0.15)] transition hover:bg-[#0d482b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingBag size={16} />
                  {adding ? "Đang thêm vào giỏ..." : "Thêm vào giỏ hàng"}
                  <ArrowRight size={15} />
                </button>
                <p className="pb-6 pt-3 text-center text-[10px] leading-5 text-[#9ca99e]">
                  Giá và dinh dưỡng sẽ được Backend xác nhận khi đặt hàng.
                </p>
              </div>
            </section>

            {/* 3. DINH DƯỠNG */}
            <aside className="rounded-[22px] border border-[#e8eee7] bg-white p-5 shadow-[0_6px_30px_rgba(20,70,35,0.035)] xl:sticky xl:top-24">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#87a08a]">
                  Theo dõi
                </p>
                <h2 className="mt-1 text-[17px] font-extrabold">
                  Giá trị dinh dưỡng
                </h2>
              </div>
              <div
                className="mx-auto mt-7 flex h-[188px] w-[188px] items-center justify-center rounded-full p-[13px]"
                style={{
                  background: macroSum
                    ? `conic-gradient(#2e8b61 0% ${greenPct}%, #e9a35b ${greenPct}% ${orangePct}%, #ed8172 ${orangePct}% 100%)`
                    : "conic-gradient(#e8efe6 0% 100%)",
                }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white shadow-inner">
                  <Flame size={20} className="text-[#dc8d40]" />
                  <strong className="mt-1 text-[35px] font-extrabold tracking-[-0.05em] tabular-nums">
                    {Math.round(totals.calories)}
                  </strong>
                  <span className="text-[11px] font-semibold text-[#879b88]">
                    kcal
                  </span>
                </div>
              </div>
              <p className="mt-4 text-center text-[11px] text-[#97a599]">
                Ước tính theo khẩu phần đã chọn
              </p>
              <div className="mt-7 space-y-5">
                {nutritionRows.map((item) => {
                  const value = totals[item.key];
                  const percent = macroSum
                    ? Math.max(0, (value / macroSum) * 100)
                    : 0;
                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="flex items-center gap-2 font-semibold text-[#56695a]">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: item.color }}
                          />
                          {item.label}
                        </span>
                        <strong className="tabular-nums">
                          {round(value)}g
                        </strong>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f0f3ee]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percent}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-7 flex items-center gap-3 rounded-xl bg-[#f2f7f0] p-3">
                {/* <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#367a50]">
                  <UtensilsCrossed size={18} />
                </div> */}
                <p className="text-[11px] leading-[1.65] text-[#69836d]">
                  Thông tin được tính từ dinh dưỡng mỗi 100g nguyên liệu.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
