import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import DesignTool from "./pages/DesignTool";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";

export type AppView = "landing" | "design" | "pricing";

function LoginGate({
  onLogin,
  isInitializing,
}: { onLogin: () => void; isInitializing: boolean }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">RoomAI</h1>
          <p className="text-gray-500 text-lg">
            AI-powered interior design at your fingertips
          </p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Welcome back
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Please sign in to access RoomAI
          </p>
          <button
            type="button"
            onClick={onLogin}
            disabled={isInitializing}
            data-ocid="login.submit_button"
            className="w-full bg-black text-white rounded-xl py-3 px-6 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInitializing ? "Loading..." : "Sign in with Internet Identity"}
          </button>
          <p className="text-xs text-gray-400 mt-4">
            Secure, decentralized login — no password needed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<AppView>("landing");
  const { identity, login, clear, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const { actor } = useActor();

  // Handle Razorpay / legacy payment redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");

    if (payment === "razorpay") {
      const status = params.get("razorpay_payment_link_status");
      const paymentId =
        params.get("razorpay_payment_id") ||
        params.get("razorpay_payment_link_reference_id") ||
        "";
      const plan = params.get("plan") || "";
      window.history.replaceState({}, "", window.location.pathname);

      if (status === "paid" && paymentId && plan) {
        sessionStorage.setItem(
          "pendingRazorpayPayment",
          JSON.stringify({ paymentId, plan }),
        );
        setView("design");
      } else if (status !== "paid") {
        setView("pricing");
      }
    } else if (payment === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      setView("design");
    } else if (payment === "cancelled") {
      window.history.replaceState({}, "", window.location.pathname);
      setView("pricing");
    }
  }, []);

  // Process pending Razorpay payment once authenticated
  useEffect(() => {
    if (!isAuthenticated || !actor) return;
    const pending = sessionStorage.getItem("pendingRazorpayPayment");
    if (!pending) return;
    sessionStorage.removeItem("pendingRazorpayPayment");

    const { paymentId, plan } = JSON.parse(pending) as {
      paymentId: string;
      plan: string;
    };
    (actor as any)
      .claimRazorpayPayment(paymentId, plan)
      .then(() => {
        toast.success(
          `🎉 ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated! Enjoy your subscription.`,
        );
      })
      .catch((err: unknown) => {
        console.error("Failed to claim payment:", err);
      });
  }, [isAuthenticated, actor]);

  // Block all access until authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginGate onLogin={login} isInitializing={isInitializing} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      {view === "landing" && (
        <LandingPage
          onGetStarted={() => setView("design")}
          onPricing={() => setView("pricing")}
          isAuthenticated={isAuthenticated}
          onLogin={login}
          onLogout={clear}
          isInitializing={isInitializing}
        />
      )}
      {view === "design" && (
        <DesignTool
          onBack={() => setView("landing")}
          onUpgrade={() => setView("pricing")}
          isAuthenticated={isAuthenticated}
          identity={identity}
          onLogin={login}
        />
      )}
      {view === "pricing" && (
        <PricingPage
          onBack={() => setView("landing")}
          isAuthenticated={isAuthenticated}
          onLogin={login}
          identity={identity}
        />
      )}
      <Toaster />
    </>
  );
}
