"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

import {
  ArrowRight,
  ClipboardList,
  FolderOpen,
  Salad,
  UtensilsCrossed,
  Users,
  RefreshCcw,
  LayoutDashboard,
} from "lucide-react";

import { Button, Card, Skeleton } from "antd";

import { get } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

interface DashboardStats {
  categories: number | null;
  ingredients: number | null;
  meals: number | null;
  orders: number | null;
  users: number | null;
}

type StatKey = keyof DashboardStats;

const initialStats: DashboardStats = {
  categories: null,
  ingredients: null,
  meals: null,
  orders: null,
  users: null,
};

function getTotalCount(payload: unknown, collectionKey: string): number | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const body = payload as Record<string, unknown>;
  const data = "data" in body ? body.data : body;

  if (Array.isArray(data)) {
    return data.length;
  }

  if (data && typeof data === "object") {
    const result = data as Record<string, unknown>;

    if (typeof result.total === "number") {
      return result.total;
    }

    if (typeof result.totalItems === "number") {
      return result.totalItems;
    }

    if (typeof result.count === "number") {
      return result.count;
    }

    const collection = result[collectionKey] ?? result.items;

    if (Array.isArray(collection)) {
      return collection.length;
    }

    if (result.pagination && typeof result.pagination === "object") {
      const pagination = result.pagination as Record<string, unknown>;

      if (typeof pagination.total === "number") {
        return pagination.total;
      }
    }
  }

  return null;
}

const statisticItems = [
  {
    key: "categories" as StatKey,
    title: "Danh mục",
    icon: FolderOpen,
    href: "/admin/categories",
    background: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    key: "ingredients" as StatKey,
    title: "Nguyên liệu",
    icon: Salad,
    href: "/admin/ingredients",
    background: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    key: "meals" as StatKey,
    title: "Món ăn",
    icon: UtensilsCrossed,
    href: "/admin/meals",
    background: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    key: "orders" as StatKey,
    title: "Đơn hàng",
    icon: ClipboardList,
    href: "/admin/orders",
    background: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    key: "users" as StatKey,
    title: "Người dùng",
    icon: Users,
    href: "/admin/users",
    background: "bg-rose-50",
    iconColor: "text-rose-600",
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");

      const endpoints: Array<{
        key: StatKey;
        url: string;
        collectionKey: string;
      }> = [
        {
          key: "categories",
          url: API_PATH.CATEGORY.LIST,
          collectionKey: "categories",
        },
        {
          key: "ingredients",
          url: API_PATH.INGREDIENT.LIST,
          collectionKey: "ingredients",
        },
        {
          key: "meals",
          url: API_PATH.MEAL.LIST,
          collectionKey: "meals",
        },
        {
          key: "orders",
          url: API_PATH.ADMIN.ORDER.BASE,
          collectionKey: "orders",
        },
        {
          key: "users",
          url: API_PATH.ADMIN.USER.BASE,
          collectionKey: "users",
        },
      ];

      const results = await Promise.allSettled(
        endpoints.map((item) => get<unknown>(item.url)),
      );

      const nextStats = { ...initialStats };
      let hasError = false;

      results.forEach((result, index) => {
        const endpoint = endpoints[index];

        if (result.status === "fulfilled") {
          nextStats[endpoint.key] = getTotalCount(
            result.value.data,
            endpoint.collectionKey,
          );

          if (nextStats[endpoint.key] === null) {
            hasError = true;
          }
        } else {
          hasError = true;
        }
      });

      setStats(nextStats);

      if (hasError) {
        setError("Một số thống kê chưa thể tải. Bạn có thể thử làm mới.");
      }
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Không thể tải thống kê"
          : "Không thể tải thống kê",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* WELCOME */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#155c39] to-[#26945b] px-7 py-8 text-white sm:px-10 sm:py-10">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[45px] border-white/10" />
        <div className="absolute -bottom-24 right-36 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-[650px]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
            <LayoutDashboard size={14} />
            Administration Dashboard
          </div>

          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
            Chào mừng đến với Heat&Heart!
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/80 sm:text-base">
            Quản lý thực đơn, nguyên liệu, đơn hàng và người dùng trong cùng một
            hệ thống.
          </p>

          <Link
            href="/admin/orders"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#155c39] transition hover:bg-green-50"
          >
            Quản lý đơn hàng
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      {/* STATISTICS */}
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-[#1d3829]">
              Thống kê hệ thống
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Tổng quan dữ liệu quản lý HealthyBowl
            </p>
          </div>

          <Button
            icon={<RefreshCcw size={16} />}
            loading={loading}
            onClick={fetchStats}
          >
            Làm mới
          </Button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statisticItems.map((item) => {
            const Icon = item.icon;
            const value = stats[item.key];

            return (
              <Link href={item.href} key={item.key}>
                <Card
                  hoverable
                  className="h-full !rounded-2xl !border-gray-100 !shadow-sm"
                >
                  {/* <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${item.background} ${item.iconColor}`}
                  >
                    <Icon size={23} />
                  </div> */}

                  <p className="text-sm font-medium text-gray-500">
                    {item.title}
                  </p>

                  {loading ? (
                    <Skeleton.Input active size="small" className="!mt-2" />
                  ) : (
                    <p className="mt-2 text-3xl font-extrabold text-[#20392a]">
                      {value === null ? "—" : value.toLocaleString("vi-VN")}
                    </p>
                  )}

                  <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-[#16834b]">
                    Xem chi tiết
                    <ArrowRight size={14} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h2 className="text-xl font-extrabold text-[#1d3829]">Quản lý nhanh</h2>

        <p className="mt-1 text-sm text-gray-500">
          Truy cập nhanh các chức năng thường sử dụng
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: "Quản lý danh mục",
              description: "Thêm, chỉnh sửa và xóa các danh mục.",
              href: "/admin/category",
              icon: FolderOpen,
            },
            {
              title: "Quản lý nguyên liệu",
              description: "Quản lý giá, dinh dưỡng và hình ảnh nguyên liệu.",
              href: "/admin/ingredients",
              icon: Salad,
            },
            {
              title: "Quản lý món ăn",
              description: "Tạo thực đơn và quản lý các món ăn có sẵn.",
              href: "/admin/meals",
              icon: UtensilsCrossed,
            },
            {
              title: "Quản lý đơn hàng",
              description: "Theo dõi đơn hàng và cập nhật trạng thái.",
              href: "/admin/orders",
              icon: ClipboardList,
            },
            {
              title: "Quản lý người dùng",
              description: "Xem tài khoản, trạng thái và phân quyền.",
              href: "/admin/users",
              icon: Users,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Link href={item.href} key={item.href}>
                <div className="group flex h-full items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eaf5ed] text-[#16834b]">
                    <Icon size={23} />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-[#1d3829]">{item.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {item.description}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#16834b]">
                      Truy cập
                      <ArrowRight
                        size={14}
                        className="transition group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
