"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
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
        setMessage(err.response?.data?.detail || "Verification failed.");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <p className="text-sm text-text-secondary">Verifying your email...</p>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-lg font-medium mb-2">Email verified!</h1>
          <p className="text-sm text-text-secondary mb-6">{message}</p>
          <a href="/login" className="inline-block bg-brand-rose text-brand-peach rounded-lg px-6 py-2.5 text-sm font-medium">
            Go to login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-lg font-medium mb-2">Verification failed</h1>
        <p className="text-sm text-brand-rose-dark bg-brand-peach rounded-lg px-3 py-2">
          {message}
        </p>
      </div>
    </main>
  );
}
