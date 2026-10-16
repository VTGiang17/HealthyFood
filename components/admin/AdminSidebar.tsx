"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Salad,
  UtensilsCrossed,
  ClipboardList,
  Users,
  ArrowLeft,
  X,
} from "lucide-react";

const menuItems = [
  {
    label: "Tổng quan",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Danh mục",
    href: "/admin/categories",
    icon: FolderOpen,
  },
  {
    label: "Nguyên liệu",
    href: "/admin/ingredients",
    icon: Salad,
  },
  {
    label: "Món ăn",
    href: "/admin/meals",
    icon: UtensilsCrossed,
  },
  {
    label: "Đơn hàng",
    href: "/admin/orders",
    icon: ClipboardList,
  },
  {
    label: "Người dùng",
    href: "/admin/users",
    icon: Users,
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-gray-100 bg-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* LOGO */}
        <div className="flex h-[76px] items-center justify-between border-b border-gray-100 px-6">
          <Link
            href="/admin"
            className="flex items-center gap-3"
            onClick={onClose}
          >
            <img
              src="/imgs/logo.png"
              alt="Heat&Heart"
              className="h-9 w-auto object-contain"
            />
            <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Admin
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
            Quản lý hệ thống
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href ||
                    pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold transition ${
                    active
                      ? "bg-[#eaf5ed] text-[#16834b]"
                      : "text-gray-500 hover:bg-gray-50 hover:text-[#16834b]"
                  }`}
                >
                  <Icon size={19} />
                  <span className="flex-1">{item.label}</span>

                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16834b]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium text-gray-500 hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
            Về trang chủ
          </Link>
        </div>
      </aside>
    </>
  );
}
