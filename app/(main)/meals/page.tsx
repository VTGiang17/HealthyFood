"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { App, Input, Select, Slider } from "antd";
import { isAxiosError } from "axios";
import { Flame, Heart, Loader2, Plus, Search } from "lucide-react";
import { getMeals, type Meal } from "@/api/admin/meal";
import { addMealToCart } from "@/api/cart";

const PRICE_MAX = 150000;

const money = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

// Chip trên cùng + checkbox "Danh mục" bên trái dùng chung state
const categoryChips = [
  { label: "Tất cả", value: "all" },
  { label: "Gà", value: "ga" },
  { label: "Bò", value: "bo" },
  { label: "Cá", value: "ca" },
  { label: "Chay", value: "chay" },
];
const sidebarCategories = [
  ...categoryChips,
  { label: "Salad", value: "salad" },
  { label: "Bowl", value: "bowl" },
];
const calorieOptions = [
  { label: "Dưới 300 kcal", value: "under300" },
  { label: "300 - 500 kcal", value: "300to500" },
  { label: "Trên 500 kcal", value: "over500" },
];

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();

const categoryMatch = (name: string, category: string) => {
  const n = normalize(name);
  if (category === "ga") return /\bga\b/.test(n);
  if (category === "bo") return /\bbo\b/.test(n);
  if (category === "ca") return /\bca\b|\bhoi\b|\bsalmon\b/.test(n);
  if (category === "salad") return /\bsalad\b/.test(n);
  if (category === "bowl") return /\bbowl\b/.test(n);
  return /\bchay\b|\brau\b|\bnam\b|\bvegan\b/.test(n);
};

const calorieMatch = (kcal: number, key: string) =>
  (key === "under300" && kcal < 300) ||
  (key === "300to500" && kcal >= 300 && kcal <= 500) ||
  (key === "over500" && kcal > 500);

const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export default function MealsPage() {
  const { message } = App.useApp();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]); // rỗng = Tất cả
  const [calories, setCalories] = useState<string[]>([]); // rỗng = Tất cả
  const [price, setPrice] = useState<[number, number]>([0, PRICE_MAX]);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("search");
    if (query) setSearch(query);
    let active = true;
    getMeals()
      .then((response) => {
        if (!response.data.success) throw new Error("Không tải được thực đơn");
        const body = response.data.data as unknown;
        const data = Array.isArray(body)
          ? body
          : (body as { meals?: Meal[] })?.meals;
        if (!Array.isArray(data))
          throw new Error("API trả sai định dạng danh sách món");
        if (active) setMeals(data.filter((m) => m.is_active));
      })
      .catch((err) => {
        console.error(err);
        if (active) message.error("Không thể lấy thực đơn từ API");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [message]);

  const toggleCategory = (value: string) =>
    setCategories((s) => (value === "all" ? [] : toggleIn(s, value)));
  const toggleCalorie = (value: string) =>
    setCalories((s) => toggleIn(s, value));

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return meals
      .filter((m) => {
        const kcal = m.totals?.calories ?? m.calories ?? 0;
        const cost = m.totals?.price ?? 0;
        return (
          normalize(m.name + " " + (m.description || "")).includes(q) &&
          (categories.length === 0 ||
            categories.some((c) => categoryMatch(m.name, c))) &&
          (calories.length === 0 ||
            calories.some((c) => calorieMatch(kcal, c))) &&
          cost >= price[0] &&
          cost <= price[1]
        );
      })
      .sort((a, b) => {
        if (sort === "priceAsc")
          return (a.totals?.price ?? 0) - (b.totals?.price ?? 0);
        if (sort === "priceDesc")
          return (b.totals?.price ?? 0) - (a.totals?.price ?? 0);
        if (sort === "calAsc")
          return (a.totals?.calories ?? 0) - (b.totals?.calories ?? 0);
        return (
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
        );
      });
  }, [meals, search, categories, calories, price, sort]);

  const add = async (meal: Meal) => {
    if (addingId) return;
    setAddingId(meal._id);
    try {
      const res = await addMealToCart(meal._id, 1);
      if (!res.data.success)
        throw new Error(res.data.message || "Không thêm được vào giỏ");
      window.dispatchEvent(new Event("cart-updated"));
      message.success(`Đã thêm ${meal.name} vào giỏ hàng`);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401)
        message.warning("Vui lòng đăng nhập để thêm món");
      else
        message.error(
          isAxiosError(err)
            ? err.response?.data?.message || "Thêm giỏ hàng thất bại"
            : err instanceof Error
            ? err.message
            : "Thêm giỏ hàng thất bại"
        );
    } finally {
      setAddingId(null);
    }
  };

  const resetFilters = () => {
    setCategories([]);
    setCalories([]);
    setPrice([0, PRICE_MAX]);
    setSearch("");
    setSort(undefined);
  };

  const chipClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${
      active
        ? "border-[#145b38] bg-[#145b38] text-white"
        : "border-[#e3e8e1] bg-white text-gray-700 hover:bg-[#f1f7ef]"
    }`;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-5 py-9 lg:px-8">
      {/* Tiêu đề + tìm kiếm */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight text-[#183227]">
            Thực đơn
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Đa dạng món ăn healthy, phù hợp với mọi mục tiêu dinh dưỡng
          </p>
        </div>
        <Input
          prefix={<Search size={15} className="text-gray-400" />}
          size="large"
          allowClear
          placeholder="Tìm món ăn, nguyên liệu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="!w-full !rounded-lg sm:!w-[320px]"
        />
      </div>

      {/* Hàng chip + sắp xếp */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categoryChips.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => toggleCategory(c.value)}
              className={chipClass(
                c.value === "all"
                  ? categories.length === 0
                  : categories.includes(c.value)
              )}
            >
              {c.label}
            </button>
          ))}
          {calorieOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggleCalorie(o.value)}
              className={chipClass(calories.includes(o.value))}
            >
              {o.label}
            </button>
          ))}
        </div>
        <Select
          value={sort}
          onChange={setSort}
          placeholder="Sắp xếp"
          allowClear
          className="!w-36 shrink-0"
          options={[
            { value: "newest", label: "Mới nhất" },
            { value: "priceAsc", label: "Giá tăng dần" },
            { value: "priceDesc", label: "Giá giảm dần" },
            { value: "calAsc", label: "Ít calo nhất" },
          ]}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="h-fit space-y-7 rounded-2xl border border-[#edf0eb] bg-white p-5">
          <div>
            <h2 className="mb-4 text-sm font-extrabold text-[#183227]">
              Danh mục
            </h2>
            <div className="space-y-3">
              {sidebarCategories.map((c) => (
                <label
                  key={c.value}
                  className="flex cursor-pointer items-center gap-2.5 text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={
                      c.value === "all"
                        ? categories.length === 0
                        : categories.includes(c.value)
                    }
                    onChange={() => toggleCategory(c.value)}
                    className="h-3.5 w-3.5 rounded accent-[#145b38]"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-extrabold text-[#183227]">
              Khoảng calo
            </h3>
            <div className="space-y-3">
              {calorieOptions.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2.5 text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={calories.includes(o.value)}
                    onChange={() => toggleCalorie(o.value)}
                    className="h-3.5 w-3.5 rounded accent-[#145b38]"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-extrabold text-[#183227]">
              Khoảng giá
            </h3>
            <p className="mb-1 text-xs text-gray-600">
              {money(price[0])} - {money(price[1])}
            </p>
            <Slider
              range
              min={0}
              max={PRICE_MAX}
              step={5000}
              value={price}
              tooltip={{ open: false }}
              onChange={(v) => setPrice(v as [number, number])}
              styles={{
                track: { background: "#145b38" },
                handle: { borderColor: "#145b38" },
              }}
            />
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-bold text-[#145b38] hover:underline"
          >
            Xóa bộ lọc
          </button>
        </aside>

        {/* Danh sách món */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-xl border border-[#edf0eb]"
                >
                  <div className="aspect-[1.25] bg-gray-100" />
                  <div className="h-24 p-4" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl bg-gray-50 py-16 text-center text-sm text-gray-500">
              Không tìm thấy món ăn phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
              {filtered.map((meal) => (
                <article
                  key={meal._id}
                  className="group overflow-hidden rounded-xl border border-[#edf0eb] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative aspect-[1.25] overflow-hidden bg-[#edf3e9]">
                    {meal.image_url ? (
                      <img
                        src={meal.image_url}
                        alt={meal.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        Chưa có ảnh
                      </div>
                    )}
                    {meal.is_recommended && (
                      <span className="absolute left-2 top-2 rounded bg-[#145b38] px-2 py-1 text-[10px] font-bold text-white">
                        Đề xuất
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setFavorites((s) => toggleIn(s, meal._id))}
                      aria-label="Yêu thích"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm"
                    >
                      <Heart
                        size={14}
                        className={
                          favorites.includes(meal._id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-600"
                        }
                      />
                    </button>
                  </div>

                  <div className="p-3.5">
                    <h3 className="line-clamp-1 text-[13px] font-bold text-[#183227]">
                      {meal.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                      <Flame size={12} className="text-orange-500" />
                      {meal.totals?.calories ?? meal.calories ?? "—"} kcal
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-[#145b38]">
                        {money(meal.totals?.price ?? 0)}
                      </span>
                      <button
                        type="button"
                        disabled={addingId !== null}
                        onClick={() => void add(meal)}
                        aria-label={`Thêm ${meal.name} vào giỏ`}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-[#145b38] text-white hover:bg-[#0d462b] disabled:opacity-50"
                      >
                        {addingId === meal._id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Plus size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/build-bowl"
              className="inline-flex rounded-full border border-[#145b38] px-5 py-3 text-xs font-bold text-[#145b38] hover:bg-[#f1f7ef]"
            >
              Không tìm được món phù hợp? Tự thiết kế suất ăn →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
