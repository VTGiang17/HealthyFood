import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  ClipboardList,
  Droplet,
  Dumbbell,
  Flame,
  Heart,
  Leaf,
  Plus,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sprout,
  Truck,
  Users,
  Utensils,
  Wheat,
} from "lucide-react";
import NewsletterForm from "@/components/home/NewsletterForm";

const container = "mx-auto w-full max-w-[1200px] px-5 lg:px-8";
const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=85`;

const IMG = {
  chicken: "photo-1547592180-85f173990554",
  beef: "photo-1512621776951-a57141f2eefd",
  salmon: "photo-1467003909585-2f8a72700288",
  veggie: "photo-1511690743698-d9d85f2fbf38",
  newest: "photo-1490645935967-10de6ba17061",
  lowcarb: "photo-1546069901-ba9599a7e63c",
};

const meals = [
  {
    id: 1,
    name: "Cơm gà nướng sốt mè",
    calories: 420,
    price: 65000,
    badge: "Bán chạy",
    badgeClass: "bg-[#f59e0b]",
    image: img(IMG.chicken),
  },
  {
    id: 2,
    name: "Cơm bò áp chảo",
    calories: 450,
    price: 75000,
    badge: "Đề xuất",
    badgeClass: "bg-[#17834c]",
    image: img(IMG.beef),
  },
  {
    id: 3,
    name: "Cơm cá hồi teriyaki",
    calories: 380,
    price: 85000,
    badge: "",
    badgeClass: "",
    image: img(IMG.salmon),
  },
  {
    id: 4,
    name: "Cơm chay thanh đạm",
    calories: 320,
    price: 55000,
    badge: "",
    badgeClass: "",
    image: img(IMG.veggie),
  },
];

const categories = [
  { name: "Cơm gà", image: img(IMG.chicken, 400), badge: "" },
  { name: "Cơm bò", image: img(IMG.beef, 400), badge: "" },
  { name: "Cơm cá", image: img(IMG.salmon, 400), badge: "" },
  { name: "Cơm chay", image: img(IMG.veggie, 400), badge: "" },
  { name: "Món mới", image: img(IMG.newest, 400), badge: "Mới" },
  { name: "Healthy low-carb", image: img(IMG.lowcarb, 400), badge: "" },
];

const benefits = [
  { icon: Sprout, title: "Nguyên liệu tươi sạch" },
  { icon: BarChart3, title: "Tính toán dinh dưỡng" },
  { icon: Truck, title: "Giao hàng nhanh" },
  { icon: ShieldCheck, title: "Hỗ trợ mục tiêu sức khỏe" },
];

const steps = [
  {
    icon: Utensils,
    title: "Chọn món",
    desc: "Khám phá thực đơn hoặc tự thiết kế",
  },
  {
    icon: ShoppingCart,
    title: "Thêm vào giỏ",
    desc: "Điều chỉnh số lượng theo nhu cầu",
  },
  {
    icon: ClipboardList,
    title: "Thanh toán",
    desc: "Chọn phương thức thanh toán",
  },
  {
    icon: Truck,
    title: "Nhận hàng",
    desc: "Giao hàng đến tận nơi",
  },
];

const stats = [
  {
    icon: Leaf,
    iconClass: "text-[#16834b]",
    title: "100%",
    desc: "Nguyên liệu tươi sạch",
  },
  {
    icon: Heart,
    iconClass: "fill-red-500 text-red-500",
    title: "Cân bằng",
    desc: "Dinh dưỡng khoa học",
  },
  {
    icon: Truck,
    iconClass: "text-[#16834b]",
    title: "Giao nhanh",
    desc: "Trong 30-60 phút",
  },
  {
    icon: Users,
    iconClass: "text-[#16834b]",
    title: "10.000+",
    desc: "Khách hàng tin tưởng",
  },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#eef5e8]">
        <Image
          src="/imgs/hero1.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[78%_center]"
        />
        {/* lớp phủ tối + blur trên mobile/tablet, tắt từ lg */}
        <div className="pointer-events-none absolute inset-0 bg-[#0b1f14]/30 backdrop-blur-[3px] lg:bg-transparent lg:backdrop-blur-none" />

        <div
          className={`${container} relative flex min-h-[460px] flex-col justify-between lg:min-h-[500px]`}
        >
          <div className="relative z-10 pb-8 pt-12 lg:pt-16">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9be3b4] lg:text-[#177547]">
              Ăn ngon • Sống khỏe • Mỗi ngày
            </p>

            <h1 className="text-[44px] font-extrabold leading-[1.1] tracking-[-0.04em] text-white sm:text-[54px] lg:text-[#16271e] lg:text-[58px]">
              Ăn ngon
              <span className="block text-[#7fdc9f] lg:text-[#16834b]">
                Sống khỏe mỗi ngày
              </span>
            </h1>

            <p className="mt-5 max-w-[360px] text-[14px] leading-[1.7] text-white/85 lg:text-[#3f4d44]">
              Cơm healthy tươi ngon, dinh dưỡng cân bằng. Dành cho một phiên bản
              tốt hơn của bạn.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/meals"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#145b38] px-6 text-[12px] font-bold text-white shadow-[0_7px_18px_rgba(20,91,56,0.18)] transition hover:bg-[#0d462b]"
              >
                Xem thực đơn
                <ArrowRight size={15} />
              </Link>

              <Link
                href="/build-bowl"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white bg-white/90 px-5 text-[12px] font-bold text-[#1c5035] shadow-sm transition hover:border-[#145b38]"
              >
                <SlidersHorizontal size={15} />
                Tự thiết kế món ăn
              </Link>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-4 pb-6 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title }) => (
              <div key={title} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#18814a] shadow-sm">
                  <Icon size={17} />
                </span>
                <span className="text-[16px] font-semibold text-white lg:text-[#33473a]">
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED MEALS */}
      <section className="bg-white py-12 lg:py-14">
        <div className={container}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[27px] font-extrabold tracking-[-0.03em] text-[#17271e] sm:text-[30px]">
                Món ăn nổi bật
              </h2>
              <p className="mt-1.5 text-[12px] text-gray-500">
                Những phần cơm healthy được yêu thích nhất
              </p>
            </div>

            <Link
              href="/meals"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#145b38] hover:underline"
            >
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
            {meals.map((meal) => (
              <article
                key={meal.id}
                className="group overflow-hidden rounded-2xl border border-[#edf0eb] bg-white shadow-[0_5px_18px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[1.4] overflow-hidden bg-[#edf3e9]">
                  <img
                    src={meal.image}
                    alt={meal.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  {meal.badge && (
                    <span
                      className={`absolute left-2.5 top-2.5 rounded-md px-2.5 py-1 text-[10px] font-bold text-white ${meal.badgeClass}`}
                    >
                      {meal.badge}
                    </span>
                  )}
                </div>

                <div className="p-3 sm:p-4">
                  <h3 className="line-clamp-1 text-[12px] font-semibold text-[#182a20] sm:text-[13px]">
                    {meal.name}
                  </h3>

                  <p className="mt-1 text-[11px] text-gray-400">
                    {meal.calories} kcal
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[14px] font-extrabold text-[#145b38] sm:text-[15px]">
                      {formatPrice(meal.price)}
                    </span>

                    <Link
                      href="/meals"
                      aria-label={`Xem ${meal.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#145b38] text-white transition hover:bg-[#0d462b]"
                    >
                      <Plus size={17} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-[#f8faf6] py-12">
        <div className={container}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[27px] font-extrabold tracking-[-0.03em] text-[#17271e] sm:text-[30px]">
                Danh mục món ăn
              </h2>
              <p className="mt-1.5 text-[12px] text-gray-500">
                Khám phá thực đơn theo sở thích của bạn
              </p>
            </div>
            <Link
              href="/meals"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#145b38] hover:underline"
            >
              Xem tất cả danh mục <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                href="/meals"
                key={category.name}
                className="group relative rounded-2xl border border-[#edf0eb] bg-white px-3 pb-3 pt-4 text-center shadow-sm transition hover:shadow-md"
              >
                {category.badge && (
                  <span className="absolute right-2 top-2 rounded-full bg-[#17834c] px-2 py-0.5 text-[9px] font-bold text-white">
                    {category.badge}
                  </span>
                )}
                <div className="mx-auto aspect-square w-[78%] overflow-hidden rounded-full bg-[#e9f0e6] ring-4 ring-[#f3f6f0]">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </div>
                <p className="mt-3 text-[12px] font-bold text-[#203629]">
                  {category.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BUILD YOUR BOWL */}
      <section className="relative overflow-hidden bg-[#f1f6ee] py-14 lg:py-16">
        <Image
          src="/imgs/banner1.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-white/20 " />
        <div
          className={`${container} relative grid items-center gap-12 lg:grid-cols-2`}
        >
          <div className="relative mx-auto w-full max-w-[460px] px-4 sm:px-8"></div>

          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#16834b]">
              Build your bowl
            </p>
            <h2 className="text-[30px] font-extrabold leading-[1.25] tracking-[-0.035em] text-[#17271e] sm:text-[36px]">
              Tự thiết kế
              <span className="block">phần cơm theo cách của bạn</span>
            </h2>

            <p className="mt-4 max-w-[400px] text-[13px] leading-7 text-gray-600">
              Lựa chọn nguyên liệu, điều chỉnh khẩu phần và theo dõi giá trị
              dinh dưỡng ngay lập tức.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Hơn 20+ loại nguyên liệu tươi ngon",
                "Tính toán calories và dinh dưỡng tự động",
                "Phù hợp với chế độ ăn của bạn",
                "Dễ dàng, nhanh chóng, tiện lợi",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#16834b] text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="text-[13px] font-medium text-[#34473a]">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/build-bowl"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-[#145b38] px-6 text-[12px] font-bold text-white transition hover:bg-[#0d462b]"
            >
              Bắt đầu thiết kế ngay
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="bg-[#f6faf3] py-12 lg:py-14">
        <div className={container}>
          <div className="mb-9 text-center">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#16834b]">
              Quy trình đơn giản
            </p>
            <h2 className="text-[26px] font-extrabold tracking-[-0.03em] text-[#17271e] sm:text-[30px]">
              Đặt món dễ dàng chỉ với 4 bước
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-[#16834b] shadow-[0_6px_20px_rgba(30,70,40,0.08)]">
                    <Icon size={28} strokeWidth={1.7} />
                  </div>

                  <h3 className="text-[13px] font-extrabold text-[#182a20]">
                    {index + 1}. {step.title}
                  </h3>

                  <p className="mt-2 max-w-[160px] text-[11px] leading-[1.7] text-gray-500">
                    {step.desc}
                  </p>

                  {index < steps.length - 1 && (
                    <ChevronRight
                      size={18}
                      className="absolute -right-3 top-6 hidden text-[#16834b] lg:block"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-20 bg-white py-12 lg:py-14">
        <div className={`${container} grid items-center gap-9 lg:grid-cols-2`}>
          <div>
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#16834b]">
              Vì sao chọn HealthyBowl?
            </p>

            <h2 className="max-w-[420px] text-[28px] font-extrabold leading-[1.25] tracking-[-0.035em] text-[#17271e] sm:text-[34px]">
              Lựa chọn thông minh cho cuộc sống khỏe mạnh
            </h2>

            <p className="mt-4 max-w-[420px] text-[13px] leading-7 text-gray-600">
              Chúng tôi không chỉ mang đến bữa ăn ngon, mà còn là giải pháp dinh
              dưỡng toàn diện cho lối sống hiện đại.
            </p>

            <Link
              href="/#about"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-[#145b38] px-5 text-[12px] font-bold text-white transition hover:bg-[#0d462b]"
            >
              Tìm hiểu thêm <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map(({ icon: Icon, iconClass, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-[#eef1ed] bg-white p-5 shadow-[0_5px_25px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-center gap-2">
                  <Icon size={20} className={iconClass} />
                  <p className="text-[15px] font-extrabold text-[#182a20]">
                    {title}
                  </p>
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="pb-12">
        <div className={container}>
          <div className="grid items-center overflow-hidden rounded-[22px] bg-[#e8f2e4] md:grid-cols-[260px_1fr_auto]">
            <img
              src={img(IMG.chicken, 650)}
              alt="Cơm healthy"
              className="h-44 w-full object-cover md:h-[150px]"
            />

            <div className="px-6 py-5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#16834b]">
                Ưu đãi đặc biệt
              </p>
              <h2 className="mt-1.5 text-[21px] font-extrabold text-[#17271e]">
                Ăn ngon hơn mỗi ngày
              </h2>
              <p className="mt-1.5 max-w-[320px] text-[11px] leading-5 text-gray-600">
                Đăng ký ngay để nhận các ưu đãi hấp dẫn và cập nhật thực đơn mới
                nhất!
              </p>
            </div>

            <div className="px-6 pb-6 md:py-0 md:pr-7">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function MacroBadge({
  className,
  icon,
  value,
  label,
}: {
  className: string;
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div
      className={`absolute z-20 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-[0_8px_25px_rgba(30,50,35,0.14)] ${className}`}
    >
      {icon}
      <div>
        <p className="text-[14px] font-extrabold leading-tight text-[#182a20]">
          {value}
        </p>
        <p className="text-[10px] text-gray-500">{label}</p>
      </div>
    </div>
  );
}
