"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

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
      router.push("/login");
    } catch (err: any) {
      const data = err.response?.data;
      setError(
        data?.new_password?.[0] ||
          data?.new_password_confirm?.[0] ||
          data?.detail ||
          "Could not reset password."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <p className="text-sm text-brand-rose-dark bg-brand-peach rounded-lg px-3 py-2">
          No reset token found. Please use the link from your email.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-amber flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">🌅</span>
        </div>
        <h1 className="text-xl font-medium mb-1">Set a new password</h1>
        <p className="text-sm text-text-secondary mb-7">
          Choose a strong password for your account.
        </p>

        <form className="space-y-3 text-left" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              New password
            </label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full border border-border-soft rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-rose"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              Confirm new password
            </label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </main>
  );
}