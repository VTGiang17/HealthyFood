import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import AntdProvider from "@/components/provider/AntdProvider";

import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Heat&Heart - Ăn ngon, sống khỏe mỗi ngày",
  description: "Cơm healthy tươi ngon, cân bằng dinh dưỡng.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={beVietnamPro.className}>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
