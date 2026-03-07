"use client";

import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth/AuthModal";

export default function LoginPage() {
  const router = useRouter();
  return (
    <AuthModal
      defaultMode="login"
      autoBlast
      onSuccess={() => router.push("/dashboard")}
    />
  );
}
