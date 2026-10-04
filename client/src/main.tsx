import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./app/App";
import { ErrorBoundary } from "./core/ErrorBoundary";
import { TenantProvider } from "./config/tenantContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <TenantProvider>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          classNames: {
            toast: "font-sans text-sm",
          },
        }}
      />
    </TenantProvider>
  </ErrorBoundary>
);