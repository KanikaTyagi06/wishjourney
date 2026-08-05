"use client";

import { useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import Stars from "@/components/Stars";
import WishJourneyMark from "@/components/WishJourneyMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const token = searchParams.get("token");
  const t = useTranslations("resetPassword");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/reset-password/", {
        token,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      router.push(`/${locale}/login`);
    } catch (err: any) {
      const data = err.response?.data;
      setError(
        data?.new_password?.[0] ||
          data?.new_password_confirm?.[0] ||
          data?.detail ||
          t("genericError")
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <Stars count={20} />
        <div className="w-full max-w-sm text-center relative z-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: "#171025",
              boxShadow: "0 0 24px -8px rgba(255, 92, 108, 0.4)",
            }}
          >
            <WishJourneyMark className="w-8 h-8" />
          </div>
          <h1 className="font-heading text-xl font-bold text-nebula-ink mb-3">
            {t("noTokenTitle")}
          </h1>
          <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2">
            {t("noTokenMessage")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <Stars count={26} />

      <div className="w-full max-w-sm text-center relative z-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: "#171025",
            boxShadow: "0 0 24px -8px rgba(224, 64, 158, 0.4)",
          }}
        >
          <WishJourneyMark className="w-8 h-8" />
        </div>

        <h1 className="font-heading text-2xl font-bold mb-1 text-nebula-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-nebula-ink-soft mb-7">{t("subtitle")}</p>

        <form className="space-y-4 text-left" onSubmit={handleSubmit}>
          <div>
            <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
              {t("newPassword")}
            </Label>
            <Input
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="bg-white/5 border-nebula-line text-nebula-ink placeholder:text-nebula-ink-soft/60 backdrop-blur-sm rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
            />
          </div>
          <div>
            <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
              {t("confirmNewPassword")}
            </Label>
            <Input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-white/5 border-nebula-line text-nebula-ink placeholder:text-nebula-ink-soft/60 backdrop-blur-sm rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
            />
          </div>

          {error && (
            <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-5 text-sm font-bold mt-2 border-0 text-[#1A0E24] disabled:opacity-60"
            style={{
              background:
                "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
              boxShadow: "0 8px 22px -8px rgba(224, 64, 158, 0.6)",
            }}
          >
            {loading ? t("resetting") : t("resetPasswordButton")}
          </Button>
        </form>
      </div>
    </main>
  );
}