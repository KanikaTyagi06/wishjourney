"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID =
  "789037311239-euq7lde21bkmnlnbmjp08kimckrrg9vk.apps.googleusercontent.com";

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/dashboard");
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

      router.push("/dashboard");
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
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-amber flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">🌅</span>
        </div>
        <h1 className="text-xl font-medium mb-1">WishJourney</h1>
        <p className="text-sm text-text-secondary mb-7">
          Turn your dreams into a plan, one wish at a time.
        </p>

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
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border-soft" />
          <span className="text-xs text-text-muted">or continue with</span>
          <div className="flex-1 h-px bg-border-soft" />
        </div>

        <div ref={googleButtonRef} className="flex justify-center" />

        <p className="text-sm text-text-secondary mt-6">
          New here?{" "}
          <a href="/register" className="text-brand-rose font-medium">
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}