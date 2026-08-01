"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("register");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register/", {
        username,
        email,
        password,
        password_confirm: passwordConfirm,
      });

      router.push(`/${locale}/login`);
    } catch (err: any) {
      const data = err.response?.data;
      const firstError =
        data?.email?.[0] ||
        data?.username?.[0] ||
        data?.password?.[0] ||
        data?.password_confirm?.[0] ||
        data?.detail ||
        "Could not create your account. Please try again.";
      setError(firstError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-amber flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">🌅</span>
        </div>
        <h1 className="text-xl font-medium mb-1">{t("title")}</h1>
        <p className="text-sm text-text-secondary mb-7">{t("subtitle")}</p>

        <form className="space-y-3 text-left" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              {t("username")}
            </label>
            <input
              type="text"
              placeholder="yourname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-border-soft rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-rose"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              {t("email")}
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-border-soft rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-rose"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              {t("password")}
            </label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-border-soft rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-rose"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              {t("confirmPassword")}
            </label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              className="w-full border border-border-soft rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-rose"
            />
          </div>

          {error && (
            <p className="text-xs text-brand-rose-dark bg-brand-peach rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-rose text-brand-peach rounded-lg py-2.5 text-sm font-medium mt-2 disabled:opacity-60"
          >
            {loading ? t("creatingAccount") : t("createAccount")}
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-6">
          {t("alreadyHaveAccount")}{" "}
          <a href={`/${locale}/login`} className="text-brand-rose font-medium">
            {t("logIn")}
          </a>
        </p>
      </div>
    </main>
  );
}