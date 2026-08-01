"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
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
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-amber flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">🌅</span>
        </div>
        <h1 className="text-xl font-medium mb-1">Reset your password</h1>
        <p className="text-sm text-text-secondary mb-7">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {submitted ? (
          <p className="text-sm text-brand-rose-dark bg-brand-peach rounded-lg px-3 py-3">
            If an account with that email exists, a reset link has been sent.
            Check your inbox.
          </p>
        ) : (
          <form className="space-y-3 text-left" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-border-soft rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-rose"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-rose text-brand-peach rounded-lg py-2.5 text-sm font-medium mt-2 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-sm text-text-secondary mt-6">
          <a href="/login" className="text-brand-rose font-medium">
            Back to login
          </a>
        </p>
      </div>
    </main>
  );
}