"use client";

import { useState } from "react";
import { Button, Input, message } from "antd";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async () => {
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      messageApi.warning("Vui lòng nhập email hợp lệ");
      return;
    }

    setLoading(true);
    // TODO: gọi API đăng ký nhận ưu đãi tại đây
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLoading(false);
    setEmail("");
    messageApi.success("Đăng ký thành công! Cảm ơn bạn.");
  };

  return (
    <>
      {contextHolder}
      <div className="flex w-full max-w-[380px] items-center gap-1 rounded-full bg-white p-1 shadow-sm">
        <Input
          variant="borderless"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onPressEnter={handleSubmit}
          placeholder="Nhập email của bạn"
          className="!px-4 !text-[12px]"
        />
        <Button
          type="primary"
          shape="round"
          loading={loading}
          onClick={handleSubmit}
          className="!h-10 !bg-[#145b38] !px-6 !text-[12px] !font-bold hover:!bg-[#0d462b]"
        >
          Đăng ký
        </Button>
      </div>
    </>
  );
}
