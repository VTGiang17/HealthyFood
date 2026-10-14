"use client";

import { usePathname } from "next/navigation";

import { Menu, ShieldCheck, UserRound } from "lucide-react";

import AdminLogoutButton from "./AdminLogoutButton";

const titles: Record<string, string> = {
  "/admin": "Tổng quan",
  "/admin/categories": "Quản lý danh mục",
  "/admin/ingredients": "Quản lý nguyên liệu",
  "/admin/meals": "Quản lý món ăn",
  "/admin/orders": "Quản lý đơn hàng",
  "/admin/users": "Quản lý người dùng",
};

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();

  const title =
    Object.entries(titles)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) =>
        path === "/admin"
          ? pathname === path
          : pathname === path || pathname.startsWith(path + "/")
      )?.[1] ?? "Quản trị hệ thống";

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-gray-100 bg-white px-5 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
          aria-label="Mở menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <p className="hidden text-[11px] text-gray-400 sm:block">
            Heat&Heart/ Quản trị
          </p>

          <h1 className="text-lg font-extrabold text-[#1c3325] sm:text-xl">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-[#edf7ef] px-3 py-2 text-xs font-semibold text-[#16834b] sm:flex">
          <ShieldCheck size={16} />
          Quản trị viên
        </div>

        <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#eaf5ed] text-[#16834b] md:flex">
          <UserRound size={20} />
        </div>

        <AdminLogoutButton />
      </div>
    </header>
  );
}
