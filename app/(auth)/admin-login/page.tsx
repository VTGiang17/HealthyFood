"use client";

import { Suspense, useState } from "react";
import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";

import { Alert, Button, Form, Input } from "antd";

import { ArrowLeft, Leaf, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import axios from "axios";

import { loginAdmin } from "@/api/admin/adminAuth";

interface LoginValues {
  email: string;
  password: string;
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (values: LoginValues) => {
    try {
      setLoading(true);
      setError("");

      await loginAdmin(values.email.trim(), values.password);

      // Chỉ cho phép chuyển hướng trong /admin.
      const next = searchParams.get("next");

      const destination =
        next && (next === "/admin" || /^\/admin\/[a-zA-Z0-9/_-]*$/.test(next))
          ? next
          : "/admin";

      router.replace(destination);
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message || "Email hoặc mật khẩu không chính xác"
        );
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Đăng nhập thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#f7faf7] lg:grid-cols-2">
      {/* LEFT CONTENT */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#155c39] p-12 text-white lg:flex">
        <div className="absolute -right-28 -top-28 h-[420px] w-[420px] rounded-full border-[65px] border-white/5" />

        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#16834b]">
            <Leaf size={25} />
          </div>

          <span className="text-2xl font-extrabold">Heat&Heart</span>
        </Link>

        <div className="relative z-10 max-w-[500px]">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <ShieldCheck size={34} />
          </div>

          <h1 className="text-4xl font-extrabold leading-tight xl:text-5xl">
            Quản lý Heat&Heart
            <span className="block text-[#b7e8c7]">tại một nơi.</span>
          </h1>

          <p className="mt-6 text-base leading-8 text-white/70">
            Hệ thống quản lý thực đơn, nguyên liệu, danh mục, đơn hàng và khách
            hàng Heat&Heart.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          Heat&Heart Administration
        </p>
      </div>

      {/* LOGIN FORM */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#16834b]"
          >
            <ArrowLeft size={17} />
            Trở về trang chủ
          </Link>

          <div className="mb-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4f3e9] text-[#16834b]">
              <LockKeyhole size={26} />
            </div>

            <h2 className="text-3xl font-extrabold text-[#183b28]">
              Đăng nhập Admin
            </h2>

            <p className="mt-3 text-sm leading-7 text-gray-500">
              Đăng nhập bằng tài khoản quản trị để truy cập hệ thống Heat&Heart.
            </p>
          </div>

          {error && (
            <Alert type="error" showIcon message={error} className="!mb-6" />
          )}

          <Form<LoginValues>
            layout="vertical"
            requiredMark={false}
            onFinish={handleLogin}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập email",
                },
                {
                  type: "email",
                  message: "Email không hợp lệ",
                },
              ]}
            >
              <Input
                size="large"
                placeholder="admin@heatandheart.vn"
                autoComplete="username"
                prefix={<Mail size={18} className="text-gray-400" />}
                className="!py-2.5"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mật khẩu",
                },
              ]}
            >
              <Input.Password
                size="large"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                prefix={<LockKeyhole size={18} className="text-gray-400" />}
                className="!py-2.5"
              />
            </Form.Item>

            <Form.Item className="!mt-8">
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                className="!h-12 !font-bold"
                style={{
                  backgroundColor: "#155c39",
                }}
              >
                Đăng nhập quản trị
              </Button>
            </Form.Item>
          </Form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Chỉ dành cho tài khoản được cấp quyền Admin.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Đang tải trang đăng nhập...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
