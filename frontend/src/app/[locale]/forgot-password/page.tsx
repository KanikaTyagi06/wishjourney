"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import Stars from "@/components/Stars";
import WishJourneyMark from "@/components/WishJourneyMark";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("forgotPassword");

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password/", { email });
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <Stars count={26} />
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

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

        {submitted ? (
          <p className="text-sm text-nebula-ink bg-white/5 border border-nebula-line rounded-xl px-4 py-4 backdrop-blur-sm">
            {t("submittedMessage")}
          </p>
        ) : (
          <form className="space-y-4 text-left" onSubmit={handleSubmit}>
            <div>
              <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("email")}
              </Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-nebula-line text-nebula-ink placeholder:text-nebula-ink-soft/60 backdrop-blur-sm rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
              />
            </div>

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
              {loading ? t("sending") : t("sendResetLink")}
            </Button>
          </form>
        )}

        <p className="text-sm text-nebula-ink-soft mt-6">
          <a
            href={`/${locale}/login`}
            className="text-nebula-magenta font-medium hover:underline"
          >
            {t("backToLogin")}
          </a>
        </p>
      </div>
    </main>
  );
}