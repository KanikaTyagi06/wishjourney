"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import Stars from "@/components/Stars";
import WishJourneyMark from "@/components/WishJourneyMark";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const token = searchParams.get("token");
  const t = useTranslations("verifyEmail");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t("noToken"));
      return;
    }

    api
      .post("/auth/verify-email/", { token })
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.detail || t("genericFailure"));
      });
  }, [token, t]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <Stars count={26} />

      <div className="w-full max-w-sm text-center relative z-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "#171025",
            boxShadow:
              status === "success"
                ? "0 0 24px -8px rgba(224, 64, 158, 0.4)"
                : status === "error"
                  ? "0 0 24px -8px rgba(255, 92, 108, 0.4)"
                  : "0 0 24px -8px rgba(82, 113, 255, 0.4)",
          }}
        >
          {status === "loading" ? (
            <div
              className="w-6 h-6 rounded-full border-2 border-nebula-blue border-t-transparent animate-spin"
              aria-hidden="true"
            />
          ) : (
            <WishJourneyMark className="w-8 h-8" />
          )}
        </div>

        {status === "loading" && (
          <>
            <h1 className="font-heading text-xl font-bold text-nebula-ink mb-2">
              {t("verifyingTitle")}
            </h1>
            <p className="text-sm text-nebula-ink-soft">
              {t("verifyingSubtitle")}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="font-heading text-2xl font-bold text-nebula-ink mb-2">
              {t("successTitle")}
            </h1>
            <p className="text-sm text-nebula-ink-soft mb-8">{message}</p>
            <a href={`/${locale}/login`}>
              <Button
                className="rounded-xl px-8 py-5 text-sm font-bold border-0 text-[#1A0E24]"
                style={{
                  background:
                    "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                  boxShadow: "0 8px 22px -8px rgba(224, 64, 158, 0.6)",
                }}
              >
                {t("goToLogin")}
              </Button>
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="font-heading text-2xl font-bold text-nebula-ink mb-2">
              {t("failTitle")}
            </h1>
            <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2 mb-8">
              {message}
            </p>
            <a href={`/${locale}/register`}>
              <Button
                variant="outline"
                className="rounded-xl px-8 py-5 text-sm font-medium bg-white/5 border-nebula-line text-nebula-ink hover:bg-white/10"
              >
                {t("backToRegister")}
              </Button>
            </a>
          </>
        )}
      </div>
    </main>
  );
}