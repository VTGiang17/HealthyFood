import Link from "next/link";
import { ArrowRight, Leaf, Mail, MapPin, Phone } from "lucide-react";

const container = "mx-auto w-full max-w-[1200px] px-5 lg:px-8";

const linkGroups = [
  {
    title: "Khám phá",
    links: [
      { name: "Thực đơn Healthy", href: "/meals" },
      { name: "Tự thiết kế phần cơm", href: "/build-bowl" },
      { name: "Về chúng tôi", href: "/#about" },
    ],
  },
  {
    title: "Hỗ trợ khách hàng",
    links: [
      { name: "Giỏ hàng", href: "/cart" },
      { name: "Theo dõi đơn hàng", href: "/orders" },
      { name: "Tài khoản của tôi", href: "/profile" },
    ],
  },
];

const contacts = [
  { icon: MapPin, text: "TP. Hồ Chí Minh, Việt Nam" },
  { icon: Phone, text: "Thông tin hotline đang cập nhật" },
  { icon: Mail, text: "Thông tin email đang cập nhật" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#183b29] text-white">
      {/* trang trí nền */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.04]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-white/[0.03]" />

      <div
        className={`${container} relative grid gap-x-10 gap-y-12 pb-12 pt-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr]`}
      >
        {/* Thương hiệu */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#20864f]">
              <Leaf size={23} strokeWidth={2.5} />
            </span>
            <span className="text-[22px] font-extrabold tracking-[-0.04em]">
              Heat&Heart
            </span>
          </Link>

          <p className="mt-5 max-w-[320px] text-[13px] leading-7 text-white/65">
            Mang đến những bữa ăn ngon, cân bằng dinh dưỡng và phù hợp với lối
            sống hiện đại của bạn.
          </p>

          <Link
            href="/meals"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-[12px] font-bold text-[#145b38] transition hover:bg-[#e8f4ea]"
          >
            Khám phá thực đơn <ArrowRight size={15} />
          </Link>
        </div>

        {/* Nhóm liên kết */}
        {linkGroups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-5 text-[13px] font-bold uppercase tracking-[0.08em] text-white">
              {group.title}
            </h3>
            <ul className="space-y-3.5 text-[13px] text-white/65">
              {group.links.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="inline-block transition hover:translate-x-1 hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Liên hệ */}
        <div>
          <h3 className="mb-5 text-[13px] font-bold uppercase tracking-[0.08em] text-white">
            Liên hệ
          </h3>
          <ul className="space-y-4 text-[13px] text-white/65">
            {contacts.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#a6e3b4]">
                  <Icon size={15} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div
          className={`${container} flex flex-col items-center justify-between gap-2 py-5 text-center text-[11px] text-white/50 sm:flex-row sm:text-left`}
        >
          <p>© Heat&Heart. All rights reserved.</p>
          <p>Ăn ngon mỗi ngày - Sống khỏe mỗi ngày</p>
        </div>
      </div>
    </footer>
  );
}
