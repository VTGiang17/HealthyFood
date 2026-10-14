"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, App } from "antd";
import { LogOut } from "lucide-react";
import axios from "axios";

import { logoutAdmin } from "@/api/admin/adminAuth";

export default function AdminLogoutButton() {
  const router = useRouter();
  const { message } = App.useApp();

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);

      await logoutAdmin();

      router.replace("/admin-login");
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        message.error(error.response?.data?.message || "Đăng xuất thất bại");
      } else {
        message.error("Không thể đăng xuất");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="text"
      icon={<LogOut size={17} />}
      loading={loading}
      onClick={handleLogout}
      danger
    >
      Đăng xuất
    </Button>
  );
}
