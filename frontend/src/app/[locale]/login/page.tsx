"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Stars from "@/components/Stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WishJourneyMark from "@/components/WishJourneyMark";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID =
  "789037311239-euq7lde21bkmnlnbmjp08kimckrrg9vk.apps.googleusercontent.com";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("login");
  const tCommon = useTranslations("common");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  async function handleGoogleResponse(response: any) {
    setError("");
    try {
      const res = await api.post("/auth/google/", {
        id_token: response.credential,
      });
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError("Could not sign in with Google. Please try again.");
    }
  }

  useEffect(() => {
    const tryInit = () => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
        });
      } else {
        setTimeout(tryInit, 300);
      }
    };
    tryInit();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login/", {
        username: email,
        password: password,
      });

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Could not log in. Check your email and password."
      );
    } finally {
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
        <p className="text-sm text-nebula-ink-soft mb-7">
          {t("tagline")}
        </p>

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
          <div>
            <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
              {t("password")}
            </Label>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/5 border-nebula-line text-nebula-ink placeholder:text-nebula-ink-soft/60 backdrop-blur-sm rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
            />
          </div>

          <div className="text-right">
            <a
              href={`/${locale}/forgot-password`}
              className="text-xs text-nebula-magenta hover:underline"
            >
              {t("forgotPassword")}
            </a>
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
            {loading ? t("loggingIn") : t("logIn")}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-nebula-line" />
          <span className="text-xs text-nebula-ink-soft">
            {t("orContinueWith")}
          </span>
          <div className="flex-1 h-px bg-nebula-line" />
        </div>

        <div ref={googleButtonRef} className="flex justify-center" />

        <p className="text-sm text-nebula-ink-soft mt-6">
          {t("newHere")}{" "}
          <a
            href={`/${locale}/register`}
            className="text-nebula-magenta font-medium hover:underline"
          >
            {t("createAccount")}
          </a>
        </p>
      </div>
    </main>
  );
}