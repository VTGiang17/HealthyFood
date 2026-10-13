"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "antd";
import { Leaf, Search, ShoppingBag, UserRound, Menu, X } from "lucide-react";
import CartDrawer, { type CartItem } from "@/components/cart/CartDrawer";

const navigation = [
  { name: "Trang chủ", href: "/" },
  { name: "Thực đơn", href: "/meals" },
  { name: "Tự thiết kế", href: "/build-bowl" },
  { name: "Về chúng tôi", href: "/#about" },
];

// TODO: thay dữ liệu mẫu này bằng state giỏ hàng thật (context / zustand / API)
const initialCart: CartItem[] = [
  {
    id: 1,
    name: "Cơm gà nướng sốt mè",
    price: 65000,
    quantity: 2,
    calories: 420,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: 3,
    name: "Cơm cá hồi teriyaki",
    price: 85000,
    quantity: 1,
    calories: 380,
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&auto=format&fit=crop&q=80",
  },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (id: CartItem["id"], quantity: number) => {
    setCartItems((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemove = (id: CartItem["id"]) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    router.push(`/meals?search=${encodeURIComponent(keyword.trim())}`);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#edf0eb] bg-white/95 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-4 px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20864f] text-white">
            <Leaf size={23} strokeWidth={2.5} />
          </div>
          <span className="text-[21px] font-extrabold tracking-[-0.06em] text-[#183227]">
            Healthy<span className="text-[#20864f]">Bowl</span>
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:flex">
          {navigation.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`whitespace-nowrap text-[12px] font-bold transition hover:text-[#16834b] ${
                  active ? "text-[#16834b]" : "text-[#3b4941]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Tìm kiếm"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#31483a] hover:bg-[#f1f5ef]"
          >
            <Search size={19} />
          </button>

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

          <Link
            href="/login"
            className="ml-1 hidden items-center gap-2 rounded-full bg-[#145b38] px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0c4429] sm:inline-flex"
          >
            <UserRound size={16} />
            Đăng nhập
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            className="ml-1 flex h-9 w-9 items-center justify-center text-[#183227] lg:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

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
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-3 text-sm font-semibold text-[#16834b] sm:hidden"
          >
            Đăng nhập
          </Link>
        </nav>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onQuantityChange={handleQuantityChange}
        onRemove={handleRemove}
      />
    </header>
  );
}
