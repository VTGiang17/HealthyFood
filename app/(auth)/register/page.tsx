"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, App, Form, Input } from "antd";
import { isAxiosError } from "axios";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from "lucide-react";

import { registerCustomer } from "@/api/customer";

type RegisterValues = {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  confirm_password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<RegisterValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const onSubmit = async (values: RegisterValues) => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await registerCustomer({
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone?.trim() || undefined,
        password: values.password,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Đăng ký không thành công");
      }

      message.success("Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.");
      router.replace("/login");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const data = err.response?.data as
          | {
              message?: string;
              errors?: { path?: (string | number)[]; message?: string }[];
            }
          | undefined;
        // Backend Zod returns errors from registerSchema; show its first issue if available.
        const detail = data?.errors?.[0]?.message;
        setError(
          detail || data?.message || "Không thể đăng ký. Vui lòng thử lại.",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể đăng ký. Vui lòng thử lại.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "!h-12 !rounded-xl !border-[#e0e8df] !bg-white hover:!border-[#9fbca5] focus-within:!border-[#286341]";

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f8faf6] px-4 py-10 text-[#20372a] sm:px-6 lg:py-16">
      <div className="mx-auto max-w-[1080px]">
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-2 text-[13px] font-medium text-[#6c7d70] transition-colors hover:text-[#235c3c]"
        >
          <ArrowLeft size={16} /> Về trang chủ
        </Link>

        <div className="grid overflow-hidden rounded-[24px] border border-[#e7ede5] bg-white shadow-[0_18px_65px_rgba(31,59,39,0.055)] lg:grid-cols-[0.88fr_1.12fr]">
          <aside className="relative hidden min-h-[690px] flex-col justify-between overflow-hidden bg-[#234f37] p-11 text-white lg:flex">
            <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full border-[88px] border-white/[0.055]" />
            <div className="pointer-events-none absolute -bottom-44 -left-36 h-[430px] w-[430px] rounded-full bg-[#38714e]/45 blur-[4px]" />
            <Link
              href="/"
              className="relative inline-flex w-fit items-center gap-3 text-xl font-bold tracking-[-0.04em] text-white"
            >
              <img
                src="/imgs/logo.png"
                alt="Heat&Heart"
                className="h-10 w-10 rounded-full bg-white object-cover"
              />
              Heat&Heart
            </Link>
            <div className="relative max-w-[325px]">
              <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.23em] text-[#b7d8bc]">
                Ăn lành, sống khỏe
              </p>
              <h1 className="text-[41px] font-semibold leading-[1.17] tracking-[-0.05em]">
                Một khởi đầu tốt đẹp đến từ mỗi bữa ăn.
              </h1>
              <p className="mt-6 text-[14px] leading-7 text-[#d3e3d5]">
                Khám phá thực đơn lành mạnh, tự chọn nguyên liệu và lưu giữ
                những bữa ăn phù hợp với bạn.
              </p>
            </div>
          </aside>

          <section className="px-6 py-9 sm:px-10 sm:py-11 lg:px-14 lg:py-14">
            <div className="mb-8 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#65886b]">
                Tạo tài khoản
              </span>
              <span className="text-[12px] text-[#86948a]">
                Đã có tài khoản?{" "}
                <Link
                  href="/login"
                  className="font-bold text-[#256141] hover:underline"
                >
                  Đăng nhập
                </Link>
              </span>
            </div>

            <h2 className="text-[31px] font-semibold tracking-[-0.045em] text-[#1d3628] sm:text-[36px]">
              Tham gia Heat&Heart
            </h2>
            <p className="mb-8 mt-2 text-[13px] leading-6 text-[#7c8a7f]">
              Tạo tài khoản để đặt món và quản lý đơn hàng của bạn.
            </p>

            {error && (
              <Alert
                type="error"
                showIcon
                message={error}
                className="!mb-5 !rounded-xl"
              />
            )}

            <Form<RegisterValues>
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={(values) => void onSubmit(values)}
              className="[&_.ant-form-item-label>label]:!text-[12px] [&_.ant-form-item-label>label]:!font-semibold [&_.ant-form-item-label>label]:!text-[#385041]"
            >
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Vui lòng nhập họ và tên",
                  },
                ]}
              >
                <Input
                  size="large"
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  className={fieldClass}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input
                  size="large"
                  type="email"
                  autoComplete="email"
                  placeholder="ban@example.com"
                  className={fieldClass}
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label={
                  <span>
                    Số điện thoại{" "}
                    <span className="font-normal text-[#9ba89e]">
                      (không bắt buộc)
                    </span>
                  </span>
                }
              >
                <Input
                  size="large"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Nhập số điện thoại"
                  className={fieldClass}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
              >
                <Input
                  size="large"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập mật khẩu"
                  className={fieldClass}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((v) => !v)}
                      aria-label={
                        passwordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      className="text-[#839489]"
                    >
                      {passwordVisible ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  }
                />
              </Form.Item>

              <Form.Item
                name="confirm_password"
                label="Xác nhận mật khẩu"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Vui lòng xác nhận mật khẩu" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value)
                        return Promise.resolve();
                      return Promise.reject(
                        new Error("Mật khẩu xác nhận không khớp"),
                      );
                    },
                  }),
                ]}
              >
                <Input
                  size="large"
                  type={confirmVisible ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  className={fieldClass}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setConfirmVisible((v) => !v)}
                      aria-label={
                        confirmVisible
                          ? "Ẩn xác nhận mật khẩu"
                          : "Hiện xác nhận mật khẩu"
                      }
                      className="text-[#839489]"
                    >
                      {confirmVisible ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  }
                />
              </Form.Item>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#235c3c] px-5 text-[13px] font-bold text-white transition hover:bg-[#19482e] disabled:cursor-wait disabled:opacity-65"
              >
                {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <ArrowRight size={17} />
                )}
              </button>
            </Form>
            {/* <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-[#8c9b90]">
              <Check size={14} className="mt-0.5 shrink-0 text-[#548361]" />
              Đăng ký xong, bạn sẽ được chuyển đến trang đăng nhập.
            </p> */}
          </section>
        </div>
      </div>
    </main>
  );
}
