import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { App } from "./App";
import { clerkAppearance } from "./lib/clerkAppearance";
import "./styles/global.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error(
    "Missing VITE_CLERK_PUBLISHABLE_KEY. Copy frontend/.env.example to frontend/.env and set your Clerk publishable key.",
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        appearance={clerkAppearance}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
      >
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>,
);
