import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import DesignTool from "./pages/DesignTool";
import LandingPage from "./pages/LandingPage";

export type AppView = "landing" | "design";

export default function App() {
  const [view, setView] = useState<AppView>("landing");

  return (
    <>
      {view === "landing" ? (
        <LandingPage onGetStarted={() => setView("design")} />
      ) : (
        <DesignTool onBack={() => setView("landing")} />
      )}
      <Toaster />
    </>
  );
}
