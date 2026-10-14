"use client";

import { useState } from "react";
import { App, ConfigProvider } from "antd";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#16834b",
          borderRadius: 10,
          fontFamily: "inherit",
        },
      }}
    >
      <App>
        <div className="min-h-screen bg-[#f7f9f7]">
          <AdminSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="min-h-screen lg:pl-[260px]">
            <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

            <main className="mx-auto w-full max-w-[1500px] px-5 py-7 lg:px-8 lg:py-8">
              {children}
            </main>
          </div>
        </div>
      </App>
    </ConfigProvider>
  );
}
