"use client";

import { App, ConfigProvider } from "antd";

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <App>{children}</App>
    </ConfigProvider>
  );
}
