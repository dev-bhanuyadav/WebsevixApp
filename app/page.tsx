"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/sections/Header";
import LoginSection from "@/components/auth/LoginSection";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-base">
      <Header />
      <LoginSection onSuccess={() => router.push("/dashboard")} />
    </main>
  );
}
