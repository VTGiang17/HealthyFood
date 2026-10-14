"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, Button, Form, Input } from "antd";
import { isAxiosError } from "axios";
import { ArrowRight, Leaf, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { customerLogin } from "@/api/customer";

type LoginValues = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (values: LoginValues) => {
    setLoading(true);
    setError("");
    try {
      const response = await customerLogin(
        values.email.trim(),
        values.password
      );
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Email hoặc mật khẩu không chính xác"
        );
      }
      window.dispatchEvent(new Event("auth-updated"));
      window.dispatchEvent(new Event("cart-updated"));
      const next = new URLSearchParams(window.location.search).get("next");
      const destination =
        next?.startsWith("/") && !next.startsWith("//") ? next : "/";
      router.replace(destination);
      router.refresh();
    } catch (e: unknown) {
      const serverMessage = isAxiosError(e)
        ? (e.response?.data as { message?: string } | undefined)?.message
        : e instanceof Error
        ? e.message
        : undefined;
      setError(serverMessage || "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden bg-[#f0f6ed] px-5 py-14">
      <div
        className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#d6ead8] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-[#dbeedd] blur-3xl"
        aria-hidden="true"
      />
      <div className="relative grid w-full max-w-[950px] overflow-hidden rounded-[28px] border border-[#e5eee1] bg-white shadow-[0_20px_70px_rgba(19,66,37,0.08)] md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-[#145b38] p-10 text-white md:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-extrabold text-white"
          >
            <Leaf size={25} /> Heat&Heart
          </Link>
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-[#b6e4bd]">
              Ăn ngon · Sống khỏe
            </p>
            <h1 className="text-4xl font-extrabold leading-tight">
              Bữa ăn cân bằng, mỗi ngày tốt hơn.
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/80">
              Khám phá thực đơn healthy, tự thiết kế khẩu phần và quản lý đơn
              hàng của bạn ở một nơi.
            </p>
          </div>
        </div>
        <div className="p-7 sm:p-10 lg:p-12">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2 font-extrabold text-[#145b38] md:hidden"
          >
            <Leaf size={22} /> Heat&Heart
          </Link>
          <h2 className="text-3xl font-extrabold text-[#182a20]">
            Chào mừng trở lại!
          </h2>
          <p className="mb-8 mt-2 text-sm text-gray-500">
            Đăng nhập để đặt món và theo dõi giỏ hàng.
          </p>
          {error && (
            <Alert type="error" showIcon message={error} className="!mb-5" />
          )}
          <Form<LoginValues>
            layout="vertical"
            requiredMark={false}
            onFinish={(values) => void login(values)}
          >
            <Form.Item
              name="email"
              label={<span className="font-semibold">Email</span>}
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input
                size="large"
                prefix={<Mail size={17} className="text-gray-400" />}
                placeholder="Nhập email của bạn"
                autoComplete="email"
                className="!h-12"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={<span className="font-semibold">Mật khẩu</span>}
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                size="large"
                prefix={<LockKeyhole size={17} className="text-gray-400" />}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                className="!h-12"
              />
            </Form.Item>
            <Button
              block
              htmlType="submit"
              type="primary"
              loading={loading}
              className="!mt-2 !h-12 !rounded-xl !bg-[#145b38] !font-bold"
            >
              Đăng nhập <ArrowRight size={16} />
            </Button>
          </Form>
          <p className="mt-7 text-center text-xs leading-6 text-gray-400">
            Tài khoản được quản lý bởi hệ thống Heat&Heart.
          </p>
          <Link
            href="/meals"
            className="mt-4 block text-center text-xs font-bold text-[#145b38] hover:underline"
          >
            Khám phá thực đơn không cần đăng nhập →
          </Link>
        </div>
      </div>
    </main>
  );
}
