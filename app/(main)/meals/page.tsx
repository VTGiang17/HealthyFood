"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { App, Drawer, Slider } from "antd";
import { isAxiosError } from "axios";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Leaf,
  Loader2,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { getMealsPage, type Meal } from "@/api/meal";
import { addMealToCart } from "@/api/cart";

const PAGE_SIZE = 9;
const MAX_DEFAULT_PRICE = 150_000;

const currency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(value)) + "đ";

type CalorieFilter = "all" | "under300" | "300to500" | "over500";
type SortKey = "newest" | "priceAsc" | "priceDesc" | "calAsc";

const calorieFilters: { label: string; value: CalorieFilter }[] = [
  { label: "Tất cả mức calo", value: "all" },
  { label: "Dưới 300 kcal", value: "under300" },
  { label: "300 – 500 kcal", value: "300to500" },
  { label: "Trên 500 kcal", value: "over500" },
];

const sortOptions: { label: string; value: SortKey }[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Giá: Thấp đến cao", value: "priceAsc" },
  { label: "Giá: Cao đến thấp", value: "priceDesc" },
  { label: "Ít calo nhất", value: "calAsc" },
];

const mealCalories = (meal: Meal) => meal.totals?.calories ?? meal.calories;
const mealPrice = (meal: Meal) => meal.totals?.price;

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 401)
      return "Vui lòng đăng nhập để thêm món vào giỏ hàng";
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || "Không thể thêm món vào giỏ hàng";
  }
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra";
}

export default function MealsPage() {
  const { message } = App.useApp();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [calorieFilter, setCalorieFilter] = useState<CalorieFilter>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0,
    MAX_DEFAULT_PRICE,
  ]);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setSearch(new URLSearchParams(window.location.search).get("search") ?? "");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setLoadError(false);
        const response = await getMealsPage({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          calorieFilter,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          sort,
        });
        if (!response.data.success || !Array.isArray(response.data.data)) {
          throw new Error("API trả về danh sách món không hợp lệ");
        }
        if (!mounted) return;
        const pagination = response.data.pagination;
        setMeals(response.data.data);
        setTotal(pagination.total);
        setTotalPages(pagination.totalPages);
        if (page > pagination.totalPages) setPage(pagination.totalPages);
      } catch (error) {
        console.error("Load meals error:", error);
        if (mounted) {
          setLoadError(true);
          setMeals([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [page, debouncedSearch, calorieFilter, priceRange, sort]);

  const currentPage = Math.min(page, totalPages);
  const visibleMeals = meals;

  const reset = () => {
    setSearch("");
    setCalorieFilter("all");
    setPriceRange([0, MAX_DEFAULT_PRICE]);
    setSort("newest");
    setPage(1);
  };

  const addToCart = async (meal: Meal) => {
    if (addingId) return;
    setAddingId(meal._id);
    try {
      const response = await addMealToCart(meal._id, 1);
      if (!response.data.success)
        throw new Error(response.data.message || "Không thể thêm món vào giỏ");
      window.dispatchEvent(new Event("cart-updated"));
      message.success(`Đã thêm ${meal.name} vào giỏ hàng`);
    } catch (error) {
      const text = getErrorMessage(error);
      if (isAxiosError(error) && error.response?.status === 401)
        message.warning(text);
      else message.error(text);
    } finally {
      setAddingId(null);
    }
  };

  const filterPanel = (
    <div className="space-y-8">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-[#182c21]">Năng lượng</h3>
        </div>
        <div className="space-y-2">
          {calorieFilters.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setCalorieFilter(option.value);
                setPage(1);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-[13px] transition ${calorieFilter === option.value ? "bg-[#eaf2eb] font-semibold text-[#205b39]" : "text-[#66766a] hover:bg-[#f5f7f3]"}`}
            >
              <span>{option.label}</span>
              <span
                className={`flex h-[17px] w-[17px] items-center justify-center rounded-full border ${calorieFilter === option.value ? "border-[#246443]" : "border-[#cfd8cf]"}`}
              >
                {calorieFilter === option.value && (
                  <span className="h-[7px] w-[7px] rounded-full bg-[#246443]" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-[#edf1e9] pt-7">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-[#182c21]">Khoảng giá</h3>
          <span className="text-[11px] text-[#809083]">VNĐ</span>
        </div>
        <div className="mb-4 flex items-center justify-between gap-2 text-[12px] font-semibold text-[#28583b]">
          <span>{currency(priceRange[0])}</span>
          <span className="text-[#a9b6aa]">—</span>
          <span>{currency(priceRange[1])}</span>
        </div>
        <Slider
          range
          min={0}
          max={MAX_DEFAULT_PRICE}
          step={5_000}
          value={priceRange}
          onChange={(value) => {
            setPriceRange(value as [number, number]);
            setPage(1);
          }}
          styles={{
            track: { background: "#246443" },
            handle: { borderColor: "#246443" },
          }}
        />
        <p className="mt-3 text-[11px] leading-5 text-[#8a978d]">
          Chọn khoảng giá phù hợp với ngân sách của bạn.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e5eae3] px-4 py-3 text-[12px] font-bold text-[#546a59] transition hover:border-[#246443] hover:text-[#246443]"
      >
        <RotateCcw size={14} /> Xóa bộ lọc
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#fafbf8] pb-20 text-[#182c21]">
      {/* Thanh giới thiệu */}
      <section className="relative overflow-hidden border-b border-[#e8eee5] bg-[#eff4ec]">
        <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-[#dce9d6]/70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-170px] right-[18%] h-72 w-72 rounded-full border-[52px] border-white/30" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-12 sm:py-16 lg:px-8 lg:py-[72px]">
          <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold text-[#73947a]">
            <Link
              href="/"
              className="hover:underline"
              style={{ color: "#73947a" }}
            >
              Trang chủ
            </Link>
            <ChevronRight size={13} />
            <span className="text-[#2d6947]">Thực đơn</span>
          </div>
          <div className="max-w-[650px]">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#31754a]">
              <Leaf size={15} /> Fresh food, better living
            </p>
            <h1 className="text-[38px] font-extrabold leading-[1.15] tracking-[-0.055em] text-[#193a27] sm:text-[48px] lg:text-[56px]">
              Ăn ngon mỗi ngày.
              <br />
              <span className="font-medium text-[#698f74]">
                Sống khỏe theo cách bạn.
              </span>
            </h1>
            <p className="mt-5 max-w-[475px] text-[13px] leading-7 text-[#647467] sm:text-[14px]">
              Khám phá những phần cơm cân bằng dinh dưỡng, được chuẩn bị từ
              nguyên liệu tươi ngon và phù hợp với nhịp sống của bạn.
            </p>
            <Link
              href="/build-bowl"
              className="mt-6 inline-flex items-center gap-2 text-[12px] font-extrabold text-[#246443] hover:underline"
              style={{ color: "#246443" }}
            >
              Hoặc tự thiết kế suất ăn của riêng bạn <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pt-10 lg:px-8 lg:pt-12">
        {/* Thanh tìm kiếm + sort */}
        <div className="mb-7 flex flex-col gap-4 border-b border-[#e7ece5] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#8ba092]">
              THE MENU
            </p>
            <h2 className="mt-1 text-[28px] font-extrabold tracking-[-0.045em] text-[#1e3527] sm:text-[32px]">
              Thực đơn hôm nay
            </h2>
            <p className="mt-1 text-[12px] text-[#819084]">
              {loading
                ? "Đang cập nhật thực đơn..."
                : `${total} món ăn sẵn sàng phục vụ`}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex h-11 items-center gap-2.5 rounded-xl border border-[#e2e9df] bg-white px-3.5 transition focus-within:border-[#91b39b] focus-within:ring-2 focus-within:ring-[#cfe2d1]/60 sm:w-[240px]">
              <Search size={17} className="shrink-0 text-[#829389]" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm món ăn..."
                aria-label="Tìm món ăn"
                className="h-full min-w-0 flex-1 bg-transparent text-[12px] text-[#213b2a] outline-none placeholder:text-[#9ca9a0]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  aria-label="Xóa tìm kiếm"
                  className="text-[#9aa99c]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortKey);
                  setPage(1);
                }}
                aria-label="Sắp xếp món ăn"
                className="h-11 w-full appearance-none rounded-xl border border-[#e2e9df] bg-white pl-3.5 pr-9 text-[12px] font-semibold text-[#355341] outline-none focus:border-[#91b39b] sm:w-[165px]"
              >
                {sortOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-3.5 text-[#829389]"
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dce7db] bg-white px-4 text-[12px] font-semibold text-[#205b39] lg:hidden"
            >
              <SlidersHorizontal size={16} /> Bộ lọc
            </button>
          </div>
        </div>

        <div className="flex gap-8 lg:gap-10">
          <aside className="hidden w-[224px] shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-[#e7ece4] bg-white p-5 shadow-[0_8px_32px_rgba(38,70,42,.035)]">
              <div className="mb-6 flex items-center gap-2 border-b border-[#edf1e9] pb-4">
                <SlidersHorizontal size={16} className="text-[#246443]" />
                <h2 className="text-[14px] font-extrabold">Bộ lọc</h2>
              </div>
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-6 flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#235c3c] px-5 py-2.5 text-[12px] font-semibold text-white">
                Tất cả món
              </span>
              <span className="text-[12px] text-[#89958a]">
                {loading ? "Đang tải..." : `${total} kết quả`}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-[20px] border border-[#edf0e9] bg-white"
                  >
                    <div className="aspect-[1.2] animate-pulse bg-[#e9eee7]" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 w-4/5 animate-pulse rounded bg-[#eef1eb]" />
                      <div className="h-3 w-2/5 animate-pulse rounded bg-[#eef1eb]" />
                      <div className="h-8 w-1/2 animate-pulse rounded bg-[#eef1eb]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#e7ece4] bg-white px-6 text-center">
                <UtensilsCrossed size={32} className="mb-4 text-[#8ea594]" />
                <p className="text-[15px] font-bold">Không tải được thực đơn</p>
                <p className="mt-2 text-[12px] text-[#8b988c]">
                  Vui lòng thử tải lại trang.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-5 rounded-full bg-[#235c3c] px-5 py-2.5 text-[12px] font-bold text-white"
                >
                  Tải lại
                </button>
              </div>
            ) : visibleMeals.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#e7ece4] bg-white px-6 text-center">
                <Search size={32} className="mb-4 text-[#8ea594]" />
                <p className="text-[15px] font-bold">
                  Không tìm thấy món phù hợp
                </p>
                <p className="mt-2 max-w-sm text-[12px] leading-6 text-[#8b988c]">
                  Thử thay đổi từ khóa hoặc khoảng giá để khám phá thêm món ăn
                  khác.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-5 inline-flex items-center gap-2 text-[12px] font-bold text-[#246443]"
                >
                  <RotateCcw size={14} /> Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {visibleMeals.map((meal) => {
                  const kcal = mealCalories(meal);
                  const price = mealPrice(meal);
                  return (
                    <article
                      key={meal._id}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#e8eee6] bg-white shadow-[0_6px_24px_rgba(29,60,39,.035)] transition duration-300 hover:-translate-y-1 hover:border-[#d4e2d1] hover:shadow-[0_16px_38px_rgba(29,60,39,.09)]"
                    >
                      <Link
                        href={`/meals/${meal._id}`}
                        className="relative block aspect-[1.18] overflow-hidden bg-[#ecf2e9]"
                      >
                        {meal.image_url ? (
                          <img
                            src={meal.image_url}
                            alt={meal.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.07]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#99b09e]">
                            <UtensilsCrossed size={42} strokeWidth={1.2} />
                          </div>
                        )}
                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold text-[#385d44] shadow-sm backdrop-blur">
                          {kcal == null
                            ? "Chưa có kcal"
                            : `${Math.round(kcal)} kcal`}
                        </span>
                      </Link>
                      <div className="flex flex-1 flex-col p-3.5 sm:p-4.5">
                        <Link href={`/meals/${meal._id}`} className="block">
                          <h3 className="line-clamp-2 min-h-[38px] text-[13px] font-extrabold leading-[1.5] text-[#203c2c] transition group-hover:text-[#246443] sm:text-[14px]">
                            {meal.name}
                          </h3>
                        </Link>
                        <p className="mt-1.5 line-clamp-2 min-h-[32px] text-[11px] leading-4 text-[#91a094] sm:text-[12px]">
                          {meal.description ||
                            "Một lựa chọn cân bằng, ngon miệng cho mỗi ngày."}
                        </p>
                        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#edf1e9] pt-4">
                          <div>
                            <p className="mb-1 text-[10px] text-[#9caa9f]">
                              Giá nguyên liệu
                            </p>
                            <p className="text-[17px] font-extrabold tracking-[-0.04em] text-[#245e3d] sm:text-[19px]">
                              {price == null ? "Liên hệ" : currency(price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void addToCart(meal)}
                            disabled={addingId !== null}
                            aria-label={`Thêm ${meal.name} vào giỏ hàng`}
                            title="Thêm vào giỏ"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#235c3c] text-white shadow-sm transition hover:bg-[#17462d] disabled:opacity-50 active:scale-95"
                          >
                            {addingId === meal._id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <ShoppingBag size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && !loadError && (
              <nav
                aria-label="Phân trang thực đơn"
                className="mt-10 flex items-center justify-center gap-2"
              >
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setPage(currentPage - 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4ebe2] bg-white text-[#476750] disabled:opacity-30"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={17} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (value) =>
                      value === 1 ||
                      value === totalPages ||
                      Math.abs(value - currentPage) <= 1,
                  )
                  .map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setPage(value);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      aria-current={value === currentPage ? "page" : undefined}
                      className={`h-10 min-w-10 rounded-xl px-3 text-[12px] font-bold transition ${value === currentPage ? "bg-[#235c3c] text-white" : "border border-[#e4ebe2] bg-white text-[#476750] hover:border-[#a0c5a8]"}`}
                    >
                      {value}
                    </button>
                  ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    setPage(currentPage + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4ebe2] bg-white text-[#476750] disabled:opacity-30"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={17} />
                </button>
              </nav>
            )}
          </div>
        </div>
      </section>

      <Drawer
        title="Bộ lọc thực đơn"
        placement="bottom"
        height="75vh"
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        className="lg:!hidden"
      >
        {filterPanel}
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(false)}
          className="mt-8 w-full rounded-xl bg-[#235c3c] px-4 py-3 text-sm font-bold text-white"
        >
          Xem {total} món ăn
        </button>
      </Drawer>
    </main>
  );
}
