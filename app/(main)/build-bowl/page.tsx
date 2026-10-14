"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Input, Spin } from "antd";
import { isAxiosError } from "axios";
import {
  Flame,
  Minus,
  Plus,
  ShoppingCart,
  RotateCcw,
  Utensils,
} from "lucide-react";
import { get } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";
import { getIngredients, type Ingredient } from "@/api/admin/ingredient";
import { addCustomBowlToCart } from "@/api/customBowlCart";

type Category = { _id: string; name: string };
type Selected = Record<string, number>;
const money = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
const round = (n: number) => Math.round(n * 10) / 10;
const idOf = (x: string | { _id: string } | undefined) =>
  typeof x === "string" ? x : x?._id ?? "";
const unwrapArray = <T,>(raw: unknown, key: string): T[] => {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj[key])) return obj[key] as T[];
  }
  return [];
};

export default function BuildBowlPage() {
  const { message } = App.useApp();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Selected>({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ingredientRes, categoryRes] = await Promise.all([
        getIngredients(),
        get(API_PATH.CATEGORY.LIST),
      ]);
      if (!ingredientRes.data.success)
        throw new Error("Không lấy được nguyên liệu");
      const ingredientData = unwrapArray<Ingredient>(
        ingredientRes.data.data,
        "ingredients"
      );
      const categoryData = unwrapArray<Category>(
        categoryRes.data,
        "categories"
      );
      setIngredients(ingredientData.filter((i) => i.is_active));
      setCategories(categoryData);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải nguyên liệu hoặc danh mục từ API");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const selectedIngredients = useMemo(
    () => ingredients.filter((i) => (selected[i._id] ?? 0) > 0),
    [ingredients, selected]
  );
  const totals = useMemo(
    () =>
      selectedIngredients.reduce(
        (acc, item) => {
          const quantity = selected[item._id] ?? 0;
          const unit = quantity / 100;
          acc.calories += (item.nutrition?.calories ?? 0) * unit;
          acc.protein += (item.nutrition?.protein ?? 0) * unit;
          acc.carbs += (item.nutrition?.carbs ?? 0) * unit;
          acc.fat += (item.nutrition?.fat ?? 0) * unit;
          acc.price += item.price_per_100g * unit;
          acc.weight += quantity;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, price: 0, weight: 0 }
      ),
    [selected, selectedIngredients]
  );

  const filtered = useMemo(
    () =>
      ingredients.filter(
        (i) =>
          (category === "all" || idOf(i.category_id) === category) &&
          i.name.toLowerCase().includes(search.toLowerCase().trim())
      ),
    [ingredients, category, search]
  );

  const updateQuantity = (ingredient: Ingredient, direction: -1 | 1) => {
    const old = selected[ingredient._id] ?? 0;
    const step = ingredient.step_grams > 0 ? ingredient.step_grams : 10;
    const min = Math.max(1, ingredient.min_grams || step);
    const max = Math.max(min, ingredient.max_grams || 1000);
    const next =
      direction === 1
        ? old === 0
          ? min
          : Math.min(max, old + step)
        : old <= min
        ? 0
        : Math.max(min, old - step);
    setSelected((prev) => {
      const newState = { ...prev };
      if (next === 0) delete newState[ingredient._id];
      else newState[ingredient._id] = next;
      return newState;
    });
  };

  const addToCart = async () => {
    if (selectedIngredients.length === 0 || adding) return;
    setAdding(true);
    try {
      const payload = selectedIngredients.map((i) => ({
        ingredient_id: i._id,
        quantity: selected[i._id],
      }));
      const response = await addCustomBowlToCart(payload, 1);
      if (!response.data.success)
        throw new Error(response.data.message || "Không thể thêm suất ăn");
      window.dispatchEvent(new Event("cart-updated"));
      message.success("Đã thêm suất ăn tự thiết kế vào giỏ hàng");
    } catch (err) {
      console.error(err);
      if (isAxiosError(err) && err.response?.status === 401)
        message.warning("Vui lòng đăng nhập để thêm vào giỏ");
      else
        message.error(
          isAxiosError(err)
            ? err.response?.data?.message || "Không thể thêm vào giỏ hàng"
            : err instanceof Error
            ? err.message
            : "Không thể thêm vào giỏ hàng"
        );
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-9 lg:px-8">
      <h1 className="text-3xl font-extrabold text-[#183227]">
        Tự thiết kế món ăn
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Chọn nguyên liệu yêu thích, tùy chỉnh định lượng và tạo suất ăn phù hợp
        với mục tiêu dinh dưỡng của bạn.
      </p>
      {loading ? (
        <div className="flex min-h-96 items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_280px]">
          {/* CỘT 1: CHỌN NGUYÊN LIỆU */}
          <section className="overflow-hidden rounded-2xl border border-[#edf0eb] bg-white">
            <div className="border-b border-[#edf0eb] p-4">
              <h2 className="text-base font-extrabold text-[#183227]">
                Nguyên liệu
              </h2>
              <Input.Search
                allowClear
                placeholder="Tìm nguyên liệu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="!mt-3"
              />
            </div>
            <div className="flex flex-wrap gap-2 border-b border-[#edf0eb] p-3">
              <button
                onClick={() => setCategory("all")}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${
                  category === "all"
                    ? "bg-[#145b38] text-white"
                    : "bg-[#f2f5f1] text-gray-700"
                }`}
              >
                Tất cả
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setCategory(c._id)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${
                    category === c._id
                      ? "bg-[#145b38] text-white"
                      : "bg-[#f2f5f1] text-gray-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="max-h-[650px] divide-y divide-[#f0f3ee] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Không có nguyên liệu phù hợp
                </div>
              ) : (
                filtered.map((i) => {
                  const q = selected[i._id] ?? 0;
                  const min = i.min_grams || 1;
                  const max = i.max_grams || 1000;
                  return (
                    <div
                      key={i._id}
                      className="flex items-center gap-3 p-3 sm:p-4"
                    >
                      {i.image_url ? (
                        <img
                          src={i.image_url}
                          alt={i.name}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#edf3e9]">
                          <Utensils size={21} className="text-[#145b38]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-[#183227]">
                          {i.name}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {round(i.nutrition?.calories ?? 0)} kcal / 100g
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#145b38]">
                          {money(i.price_per_100g)} / 100g
                        </p>
                      </div>
                      <div className="shrink-0">
                        <div className="flex items-center rounded-lg border border-[#e1e9de]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(i, -1)}
                            disabled={q === 0}
                            aria-label={`Giảm ${i.name}`}
                            className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-12 text-center text-xs font-bold">
                            {q}g
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(i, 1)}
                            disabled={q >= max}
                            aria-label={`Tăng ${i.name}`}
                            className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <p className="mt-1 text-center text-[10px] text-gray-400">
                          {min}–{max}g
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
          {/* CỘT 2: SUẤT ĂN */}
          <section className="h-fit rounded-2xl border border-[#edf0eb] bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#183227]">
                Suất ăn của bạn
              </h2>
              <button
                onClick={() => setSelected({})}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold text-[#145b38]"
              >
                <RotateCcw size={13} /> Đặt lại
              </button>
            </div>
            <div className="flex aspect-[1.5] items-center justify-center rounded-2xl bg-[#f1f7ed]">
              <div className="text-center">
                <Utensils className="mx-auto mb-2 text-[#145b38]" size={42} />
                <strong className="text-2xl text-[#183227]">
                  {round(totals.weight)}g
                </strong>
                <p className="mt-2 text-xs text-gray-500">
                  {selectedIngredients.length} nguyên liệu đã chọn
                </p>
              </div>
            </div>
            {selectedIngredients.length === 0 ? (
              <p className="py-9 text-center text-sm text-gray-400">
                Nhấn dấu + bên trái để xây dựng suất ăn
              </p>
            ) : (
              <div className="mt-5 divide-y divide-[#f0f3ee]">
                {selectedIngredients.map((i) => (
                  <div
                    key={i._id}
                    className="flex items-center justify-between gap-2 py-3 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate text-gray-700">
                      {i.name}
                    </span>
                    <span className="shrink-0 font-semibold">
                      {selected[i._id]}g
                    </span>
                    <span className="w-16 text-right text-gray-500">
                      {round(
                        ((i.nutrition?.calories ?? 0) * selected[i._id]) / 100
                      )}{" "}
                      kcal
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 flex items-center justify-between border-t pt-5">
              <span className="text-sm text-gray-500">
                Giá nguyên liệu dự kiến
              </span>
              <strong className="text-xl text-[#145b38]">
                {money(totals.price)}
              </strong>
            </div>
            <Button
              block
              type="primary"
              size="large"
              className="!mt-5 !h-12 !bg-[#145b38] !font-bold"
              disabled={selectedIngredients.length === 0}
              loading={adding}
              onClick={() => void addToCart()}
              icon={<ShoppingCart size={17} />}
            >
              Thêm vào giỏ hàng
            </Button>
          </section>
          {/* CỘT 3: DINH DƯỠNG */}
          <aside className="h-fit rounded-2xl border border-[#edf0eb] bg-white p-5">
            <h2 className="text-base font-extrabold text-[#183227]">
              Thông tin dinh dưỡng
            </h2>
            <div
              className="mx-auto my-6 flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(#17834c 0% 35%, #f4a340 35% 70%, #de6d5f 70% 100%)",
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                <Flame size={20} className="text-orange-500" />
                <strong className="text-3xl text-[#183227]">
                  {Math.round(totals.calories)}
                </strong>
                <span className="text-xs text-gray-500">kcal</span>
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  name: "Protein",
                  value: totals.protein,
                  color: "bg-[#17834c]",
                },
                { name: "Carbs", value: totals.carbs, color: "bg-[#e36b56]" },
                { name: "Fat", value: totals.fat, color: "bg-[#f2a53e]" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-gray-600">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                    />
                    {item.name}
                  </span>
                  <strong>{round(item.value)}g</strong>
                </div>
              ))}
            </div>
            <p className="mt-7 rounded-xl bg-[#f1f7ed] p-3 text-xs leading-5 text-gray-600">
              Dinh dưỡng và giá được ước tính từ số gram nguyên liệu. Giá cuối
              cùng do Backend xác nhận khi thêm giỏ hoặc đặt hàng.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
