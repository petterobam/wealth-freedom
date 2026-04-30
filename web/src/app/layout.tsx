import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "财富自由之路 - 个人财务管理软件",
  description:
    "系统化管理个人财务，从财务保障到财务安全再到财务自由。预算管理、投资追踪、AI财务助手，助你实现财务自由。",
  keywords: [
    "财务管理",
    "财务自由",
    "预算管理",
    "投资追踪",
    "理财软件",
    "AI财务助手",
  ],
  openGraph: {
    title: "财富自由之路 - 个人财务管理软件",
    description: "系统化管理个人财务，实现财务自由的三步之路",
    type: "website",
    locale: "zh_CN",
    siteName: "财富自由之路",
  },
  twitter: {
    card: "summary_large_image",
    title: "财富自由之路",
    description: "系统化管理个人财务，实现财务自由",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
