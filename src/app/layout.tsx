import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://car-cost.kr"),
  title: {
    default: "차비얼마 | 자동차 이동비·기름값·톨비 계산기",
    template: "%s | 차비얼마",
  },
  description:
    "출발지와 목적지를 입력하면 실제 주행거리, 예상 시간, 기름값, 통행료와 인원별 자동차 이동비를 한 번에 계산합니다.",
  applicationName: "차비얼마",
  keywords: [
    "차비 계산기",
    "자동차 이동비 계산기",
    "기름값 계산기",
    "톨비 계산기",
    "주유비 계산기",
    "자동차 여행 경비",
    "교통비 계산기",
  ],
  authors: [{ name: "차비얼마" }],
  creator: "차비얼마",
  publisher: "차비얼마",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "차비얼마",
    title: "차비얼마 | 자동차 이동비·기름값·톨비 계산기",
    description:
      "출발지와 목적지만 입력하면 실제 주행거리와 기름값, 통행료, 인원별 차비를 한 번에 계산합니다.",
  },
  twitter: {
    card: "summary",
    title: "차비얼마 | 자동차 이동비·기름값·톨비 계산기",
    description:
      "출발지와 목적지만 입력하면 실제 주행거리와 기름값, 통행료, 인원별 차비를 한 번에 계산합니다.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "travel",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
