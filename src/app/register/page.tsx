import { composeMiniAppConfig } from "@/lib/config/mini-app-config";
import { loadMagsterCatalog } from "@/lib/magster/catalog";
import { loadActivePaymentMethods } from "@/lib/magster/payment-methods";
import { loadRegistrationCatalog } from "@/lib/magster/registration";
import { loadMagsterPublicSettings } from "@/lib/magster/settings";
import { MagsterLoadError } from "@/components/ui/magster-load-error";
import { RegistrationFlow } from "@/components/wizard/registration-flow";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  try {
    const [settings, catalog, paymentMethods, registration] = await Promise.all([
      loadMagsterPublicSettings(),
      loadMagsterCatalog(),
      loadActivePaymentMethods(),
      loadRegistrationCatalog(),
    ]);

    return (
      <RegistrationFlow
        initial={{
          ok: true,
          config: composeMiniAppConfig(settings),
          catalog,
          paymentMethods,
          registration,
        }}
      />
    );
  } catch (error) {
    console.error("Unable to load Magster registration data:", error);
    return (
      <main className="flex min-h-0 flex-1 flex-col justify-center">
        <MagsterLoadError message="Unable to load Magster data. Please try again." />
      </main>
    );
  }
}