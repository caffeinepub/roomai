import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "./index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// Block Puter from redirecting the main window to puter.com
(function blockPuterRedirects() {
  const BLOCKED_HOSTS = ["puter.com", "js.puter.com"];
  const isBlockedUrl = (url: string) => {
    try {
      const u = new URL(url, window.location.href);
      return BLOCKED_HOSTS.some(
        (h) => u.hostname === h || u.hostname.endsWith(`.${h}`),
      );
    } catch {
      return false;
    }
  };

  const origAssign = window.location.assign.bind(window.location);
  const origReplace = window.location.replace.bind(window.location);

  window.location.assign = (url: string) => {
    if (isBlockedUrl(url)) {
      console.warn("[StagePro] Blocked Puter redirect:", url);
      return;
    }
    origAssign(url);
  };
  window.location.replace = (url: string) => {
    if (isBlockedUrl(url)) {
      console.warn("[StagePro] Blocked Puter redirect:", url);
      return;
    }
    origReplace(url);
  };

  // Override href setter
  const locDesc = Object.getOwnPropertyDescriptor(window, "location");
  if (!locDesc || locDesc.configurable) {
    try {
      const proto = Object.getPrototypeOf(window.location);
      const hrefDesc = Object.getOwnPropertyDescriptor(proto, "href");
      if (hrefDesc?.set) {
        const origSet = hrefDesc.set;
        Object.defineProperty(proto, "href", {
          ...hrefDesc,
          set(url: string) {
            if (isBlockedUrl(url)) {
              console.warn("[StagePro] Blocked Puter href redirect:", url);
              return;
            }
            origSet.call(this, url);
          },
        });
      }
    } catch (e) {
      console.warn("[StagePro] Could not override location.href setter", e);
    }
  }

  // Block popstate/navigation to puter.com via pushState
  const origPushState = history.pushState.bind(history);
  history.pushState = (
    state: any,
    title: string,
    url?: string | URL | null,
  ) => {
    if (url && isBlockedUrl(String(url))) {
      console.warn("[StagePro] Blocked Puter pushState:", url);
      return;
    }
    origPushState(state, title, url);
  };
})();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
