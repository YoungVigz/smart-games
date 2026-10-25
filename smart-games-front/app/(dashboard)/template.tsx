"use client";
import PageTransition from "@/components/dashboard/PageTransition";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}