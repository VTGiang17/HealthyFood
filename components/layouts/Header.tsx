"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge, Dropdown, App } from "antd";
import type { MenuProps } from "antd";

import { isAxiosError } from "axios";

import {
  Leaf,
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

import CartDrawer from "@/components/cart/CartDrawer";

import { get, post } from "@/libs/axios";
import { getCart } from "@/api/cart";

const navigation = [
  { name: "Trang chủ", href: "/" },
  { name: "Thực đơn", href: "/meals" },
  { name: "Tự thiết kế", href: "/build-bowl" },
  { name: "Về chúng tôi", href: "/#about" },
];

// Chỉnh lại nếu Backend dùng endpoint khác.
const AUTH_ME_URL = "/api/auth/me";
const AUTH_LOGOUT_URL = "/api/auth/logout";

interface CurrentUser {
  _id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AuthResponse {
  success: boolean;
  data?:
    | CurrentUser
    | {
        user?: CurrentUser;
      };
}

function extractUser(data: AuthResponse["data"]): CurrentUser | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  if ("user" in data && data.user) {
    return data.user;
  }

  if ("email" in data || "full_name" in data || "role" in data) {
    return data as CurrentUser;
  }

  return null;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { message } = App.useApp();

  // Navigation
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  // Cart
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Auth
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchCartCount = useCallback(async () => {
    try {
      const response = await getCart();

      const cart = response.data.data;

      const items = Array.isArray(cart?.items) ? cart.items : [];

      const quantity = items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      );

      console.log("🔢 Tổng số lượng:", quantity);

      setCartCount(quantity);
    } catch (error) {
      setCartCount(0);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setAuthLoading(true);

      const response = await get<AuthResponse>(AUTH_ME_URL);

      if (!response.data.success) {
        setUser(null);
        return;
      }

      const currentUser = extractUser(response.data.data);

      setUser(currentUser);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status !== 401) {
        console.error("Check authentication error:", error);
      }

      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCurrentUser();
    void fetchCartCount();
  }, [fetchCurrentUser, fetchCartCount]);

  useEffect(() => {
    const handleCartUpdated = () => {
      void fetchCartCount();
    };

    const handleAuthUpdated = () => {
      void fetchCurrentUser();
      void fetchCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    window.addEventListener("auth-updated", handleAuthUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);

      window.removeEventListener("auth-updated", handleAuthUpdated);
    };
  }, [fetchCartCount, fetchCurrentUser]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);

    void fetchCurrentUser();
    void fetchCartCount();
  }, [pathname, fetchCurrentUser, fetchCartCount]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const searchValue = keyword.trim();

    if (!searchValue) return;

    router.push(`/meals?search=${encodeURIComponent(searchValue)}`);

    setSearchOpen(false);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      const response = await post<{
        success: boolean;
        message?: string;
      }>(AUTH_LOGOUT_URL);

      if (!response.data.success) {
        throw new Error(response.data.message || "Đăng xuất không thành công");
      }

      setUser(null);
      setCartCount(0);
      setCartOpen(false);
      setMenuOpen(false);

      window.dispatchEvent(new Event("auth-updated"));

      message.success("Đăng xuất thành công");

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      message.error("Không thể đăng xuất, vui lòng thử lại");
    } finally {
      setLoggingOut(false);
    }
  };

  const displayName =
    user?.full_name || user?.name || user?.email?.split("@")[0] || "Tài khoản";

  const userMenuItems: MenuProps["items"] = [
    {
      key: "account",
      label: "Thông tin tài khoản",
      icon: <UserRound size={16} />,
      onClick: () => router.push("/profile"),
    },
    ...(user?.role === "admin"
      ? [
          {
            key: "admin",
            label: "Trang quản trị",
            icon: <ShieldCheck size={16} />,
            onClick: () => router.push("/admin"),
          },
        ]
      : []),
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      label: loggingOut ? "Đang đăng xuất..." : "Đăng xuất",
      icon: <LogOut size={16} />,
      danger: true,
      disabled: loggingOut,
      onClick: () => void handleLogout(),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#edf0eb] bg-white/95 backdrop-blur-xl">
        <div className="relative mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-4 px-5 lg:px-8">
          {/* LOGO */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20864f] text-white">
              <Leaf size={23} strokeWidth={2.5} />
            </div>

            <span className="text-[21px] font-extrabold tracking-[-0.06em] text-[#183227]">
              Heat&
              <span className="text-[#20864f]">Heart</span>
            </span>
          </Link>

          {/* NAVIGATION DESKTOP */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:flex">
            {navigation.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : item.href.startsWith("/#")
                  ? false
                  : pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    color: active ? "#16834b" : "#000000",
                    textDecoration: "none",
                  }}
                  className="whitespace-nowrap text-[12px] font-bold transition-colors hover:!text-[#16834b]"
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* HEADER ACTIONS */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* SEARCH */}
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Tìm kiếm"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#31483a] hover:bg-[#f1f5ef]"
            >
              <Search size={19} />
            </button>

            {/* CART */}
            <button
              type="button"
              onClick={() => {
                setCartOpen(true);
                setMenuOpen(false);
              }}
              aria-label={`Giỏ hàng (${cartCount} món)`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#31483a] hover:bg-[#f1f5ef]"
            >
              <Badge
                count={cartCount}
                size="small"
                offset={[4, -4]}
                color="#16834b"
              >
                <ShoppingBag size={19} className="text-[#31483a]" />
              </Badge>
            </button>

            {/* AUTH DESKTOP */}
            {authLoading ? (
              <div className="ml-1 hidden h-10 w-28 animate-pulse rounded-full bg-gray-100 sm:block" />
            ) : user ? (
              <Dropdown
                menu={{ items: userMenuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <button
                  type="button"
                  className="ml-1 hidden max-w-[180px] items-center gap-2 rounded-full bg-[#e8f2e4] px-4 py-2.5 text-[12px] font-bold text-[#145b38] transition hover:bg-[#d8ebd5] sm:inline-flex"
                >
                  <UserRound size={16} className="shrink-0" />

                  <span className="truncate">{displayName}</span>

                  <ChevronDown size={14} className="shrink-0" />
                </button>
              </Dropdown>
            ) : (
              <Link
                href="/login"
                className="ml-1 hidden items-center gap-2 rounded-full bg-[#145b38] px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0c4429] sm:inline-flex"
              >
                <UserRound size={16} />
                Đăng nhập
              </Link>
            )}

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Menu"
              className="ml-1 flex h-9 w-9 items-center justify-center text-[#183227] lg:hidden"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* SEARCH BOX */}
        {searchOpen && (
          <form
            onSubmit={handleSearch}
            className="mx-auto flex max-w-[1200px] gap-3 border-t border-gray-100 px-5 py-4 lg:px-8"
          >
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm món ăn..."
              autoFocus
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#20864f]"
            />

            <button
              type="submit"
              className="rounded-xl bg-[#145b38] px-5 py-2 text-xs font-bold text-white"
            >
              Tìm kiếm
            </button>
          </form>
        )}

        {/* MOBILE MENU */}
        {menuOpen && (
          <nav className="flex flex-col border-t border-gray-100 bg-white px-5 py-3 lg:hidden">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-[#294333] hover:bg-[#f1f5ef]"
              >
                {item.name}
              </Link>
            ))}

            {!authLoading &&
              (user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm font-semibold text-[#16834b]"
                  >
                    {displayName}
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-3 py-3 text-sm font-semibold text-[#16834b]"
                    >
                      Trang quản trị
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={loggingOut}
                    className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-500"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-[#16834b] sm:hidden"
                >
                  Đăng nhập
                </Link>
              ))}
          </nav>
        )}
      </header>

      {/* GIỎ HÀNG DÙNG API */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
