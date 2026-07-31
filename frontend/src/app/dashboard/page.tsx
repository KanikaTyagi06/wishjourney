"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, logout } from "@/lib/auth";
import { api } from "@/lib/api";

interface Profile {
  username: string;
  full_name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    api
      .get("/profiles/me/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProfile(res.data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-text-secondary">Loading...</p>
      </main>
    );
  }

  const displayName = profile?.full_name || profile?.username || "there";

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <nav className="border-b border-border-soft">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-amber flex items-center justify-center text-sm">
              🌅
            </div>
            <span className="font-medium text-sm">WishJourney</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <span className="text-brand-rose font-medium">Home</span>
            <span>Explore</span>
            <span>Memories</span>
            <span>Friends</span>
            <button
              onClick={handleLogout}
              className="text-xs text-text-secondary border border-border-soft rounded-lg px-3 py-1.5 ml-2"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-sm text-text-secondary">Good morning</p>
          <h1 className="text-2xl font-medium">{displayName}</h1>
          <p className="text-sm text-text-secondary mt-1">
            Your next dream awaits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left / main column */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-brand-peach rounded-2xl p-5">
              <p className="text-xs text-brand-rose-dark font-medium mb-1">
                In progress · Travel
              </p>
              <p className="text-lg font-medium text-brand-rose-darker">
                Trek to Everest Base Camp
              </p>
              <p className="text-sm text-brand-rose-dark mt-2">
                Budget-friendly plan · 68% saved
              </p>
              <div className="h-1.5 bg-white/50 rounded-full mt-3 overflow-hidden">
                <div className="h-full w-[68%] bg-brand-rose-dark rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-brand-amber rounded-2xl p-4">
                <p className="text-sm font-medium text-brand-amber-text">
                  Learn Spanish
                </p>
                <p className="text-xs text-brand-amber-icon mt-0.5">Idea</p>
              </div>
              <div className="bg-brand-purple rounded-2xl p-4">
                <p className="text-sm font-medium text-brand-purple-text">
                  Cherry blossoms, Japan
                </p>
                <p className="text-xs text-brand-purple-icon mt-0.5">Saved</p>
              </div>
            </div>

            <button className="w-full bg-brand-rose text-brand-peach rounded-lg py-3 text-sm font-medium">
              Plan my next wish
            </button>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="border border-border-soft rounded-2xl p-4">
              <p className="text-xs text-text-secondary mb-3 font-medium">
                Your progress
              </p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">Bucket list</span>
                <span className="font-medium">14</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">In progress</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Completed</span>
                <span className="font-medium">7</span>
              </div>
            </div>

            <div className="border border-border-soft rounded-2xl p-4">
              <p className="text-xs text-text-secondary mb-3 font-medium">
                Recommended for you
              </p>
              <p className="text-sm mb-1">🏃 Run a marathon</p>
              <p className="text-sm mb-1">👨‍🍳 Cooking class</p>
              <p className="text-sm">📷 Photography basics</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}