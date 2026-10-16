"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  UserRound,
} from "lucide-react";
import { getCustomerProfile, type CustomerProfile } from "@/api/customer";

const shell = "mx-auto w-full max-w-[1120px] px-5 lg:px-8";

function initials(name: string) {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  return (
    tokens
      .slice(-2)
      .map((token) => token[0])
      .join("")
      .toUpperCase() || "HH"
  );
}

function DetailRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-[#eaece6] py-5 last:border-0 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center sm:gap-7">
      <dt className="text-[13px] font-medium text-[#879188]">{label}</dt>
      <dd
        className={`min-w-0 break-words text-[14px] font-medium ${muted ? "text-[#939b94]" : "text-[#25372b]"}`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      setUnauthorized(false);
      try {
        const response = await getCustomerProfile();
        if (!response.data.success || !response.data.data) {
          throw new Error(
            response.data.message || "Không thể lấy thông tin tài khoản",
          );
        }
        if (active) setProfile(response.data.data);
      } catch (err: unknown) {
        if (!active) return;
        if (isAxiosError(err) && err.response?.status === 401) {
          setUnauthorized(true);
          setError("Bạn cần đăng nhập để xem thông tin tài khoản.");
        } else {
          setError(
            isAxiosError(err)
              ? (err.response?.data as { message?: string } | undefined)
                  ?.message || "Không thể tải hồ sơ"
              : err instanceof Error
                ? err.message
                : "Không thể tải hồ sơ",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [retryCount]);

  return (
    <main className="bg-[#fafaf7] text-[#26382b]">
      <div className="border-b border-[#eaeee7] bg-[#f1f4ee]">
        <div className={`${shell} py-[30px]`}>
          <nav
            aria-label="Đường dẫn"
            className="flex items-center gap-2 text-[12px] text-[#7d8a7d]"
          >
            <Link href="/" className="transition-colors hover:text-[#295b3f]">
              Trang chủ
            </Link>
            <ChevronRight size={13} strokeWidth={1.5} />
            <span className="font-medium text-[#315b40]">Tài khoản</span>
          </nav>
        </div>
      </div>

      <div className={`${shell} py-[50px]`}>
        {loading ? (
          <div
            className="grid gap-6 lg:grid-cols-[310px_minmax(0,1fr)]"
            aria-live="polite"
            aria-label="Đang tải thông tin tài khoản"
          >
            <div className="h-[310px] animate-pulse rounded-[20px] border border-[#e9ede7] bg-white p-7">
              <div className="h-20 w-20 rounded-full bg-[#edf1eb]" />
              <div className="mt-7 h-6 w-40 rounded bg-[#edf1eb]" />
              <div className="mt-3 h-4 w-52 rounded bg-[#f1f3ef]" />
            </div>
            <div className="min-h-[310px] animate-pulse rounded-[20px] border border-[#e9ede7] bg-white p-8">
              <div className="h-6 w-48 rounded bg-[#edf1eb]" />
              <div className="mt-10 space-y-9">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-4 w-3/4 rounded bg-[#f0f3ef]" />
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <section className="mx-auto max-w-xl rounded-[20px] border border-[#e8ece5] bg-white px-7 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2eb] text-[#50735b]">
              <UserRound size={24} strokeWidth={1.4} />
            </div>
            <h2 className="mt-6 text-[22px] font-semibold tracking-[-0.035em]">
              {unauthorized ? "Bạn chưa đăng nhập" : "Chưa thể hiển thị hồ sơ"}
            </h2>
            <p className="mt-2 text-[14px] leading-7 text-[#819085]">{error}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {unauthorized ? (
                <Link
                  href="/login?next=%2Fprofile"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#275b3e] px-6 text-[13px] font-semibold text-white hover:bg-[#1d4931]"
                >
                  Đăng nhập <ArrowRight size={15} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setRetryCount((v) => v + 1)}
                  className="h-11 rounded-xl bg-[#275b3e] px-6 text-[13px] font-semibold text-white hover:bg-[#1d4931]"
                >
                  Thử lại
                </button>
              )}
              <Link
                href="/"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#e2e8df] px-5 text-[13px] font-medium text-[#526a56] hover:border-[#90aa93]"
              >
                <ArrowLeft size={15} /> Trang chủ
              </Link>
            </div>
          </section>
        ) : profile ? (
          <div className="grid items-start gap-6 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-8">
            <aside className="overflow-hidden rounded-[20px] border border-[#e8ece6] bg-white">
              <div className="h-[5px] bg-[#315f43]" />
              <div className="px-7 pb-8 pt-9">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={`Ảnh đại diện của ${profile.full_name}`}
                    className="h-[84px] w-[84px] rounded-full border border-[#e7eae2] object-cover"
                  />
                ) : (
                  <div
                    className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-[#eaf0e7] text-[27px] font-semibold tracking-[-0.06em] text-[#42664a]"
                    aria-label="Ảnh đại diện mặc định"
                  >
                    {initials(profile.full_name)}
                  </div>
                )}
                <h2 className="mt-6 break-words text-[22px] font-semibold leading-snug tracking-[-0.045em]">
                  {profile.full_name}
                </h2>
                <p className="mt-1.5 break-all text-[13px] text-[#8a978c]">
                  {profile.email}
                </p>
                <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-[#e1eadf] bg-[#f5f8f3] px-3 py-1.5 text-[11px] font-semibold text-[#42704e]">
                  <Check size={13} strokeWidth={2} /> Tài khoản đang hoạt động
                </div>
              </div>
              <div className="border-t border-[#edf0ea] px-7 py-5">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#a2aca3]">
                  HEAT&HEART MEMBER
                </span>
                <p className="mt-2 text-[12px] leading-6 text-[#8c978c]">
                  Cảm ơn bạn đã đồng hành cùng những bữa ăn lành mạnh.
                </p>
              </div>
            </aside>

            <div className="space-y-6">
              <section className="rounded-[20px] border border-[#e8ece6] bg-white px-6 py-7 sm:px-9 sm:py-9">
                <div className="border-b border-[#eaece6] pb-6">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8eaa91]">
                    Thông tin cá nhân
                  </p>
                  <h2 className="text-[23px] font-semibold tracking-[-0.045em] text-[#283e30]">
                    Thông tin cá nhân
                  </h2>
                  <p className="mt-2 text-[13px] leading-6 text-[#89968a]">
                    Thông tin đang được lưu trên tài khoản Heat&Heart của bạn.
                  </p>
                </div>
                <dl>
                  <DetailRow label="Họ và tên" value={profile.full_name} />
                  <DetailRow label="Địa chỉ email" value={profile.email} />
                  <DetailRow
                    label="Số điện thoại"
                    value={profile.phone?.trim() || "Chưa cập nhật"}
                    muted={!profile.phone?.trim()}
                  />
                </dl>
                {/* <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#f6f8f3] px-4 py-3.5">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#6e9775]" />
                  <p className="text-[12px] leading-6 text-[#738376]">
                    Thông tin được đồng bộ từ tài khoản của bạn. Chức năng chỉnh
                    sửa sẽ khả dụng khi hệ thống hỗ trợ cập nhật hồ sơ.
                  </p>
                </div> */}
              </section>

              <section className="rounded-[20px] border border-[#e8ece6] bg-white px-6 py-7 sm:px-9 sm:py-8">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8eaa91]">
                  Chọn bữa ăn tiếp theo của bạn
                </p>
                <h2 className="text-[20px] font-semibold tracking-[-0.045em]">
                  Bữa ăn tiếp theo của bạn
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-[#8a978b]">
                  Khám phá thực đơn của chúng mình hoặc tạo một suất cơm hợp với
                  sở thích riêng.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/meals"
                    className="group flex items-center justify-between rounded-xl border border-[#e4eae2] px-4 py-4 text-[13px] font-semibold text-[#355840] transition hover:border-[#adc5b0] hover:bg-[#f8faf6]"
                  >
                    <span>Khám phá thực đơn</span>
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                  <Link
                    href="/build-bowl"
                    className="group flex items-center justify-between rounded-xl border border-[#e4eae2] px-4 py-4 text-[13px] font-semibold text-[#355840] transition hover:border-[#adc5b0] hover:bg-[#f8faf6]"
                  >
                    <span>Tự thiết kế suất ăn</span>
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
