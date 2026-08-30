import { composeMiniAppConfig } from "@/lib/config/mini-app-config";
import { loadMagsterCatalog } from "@/lib/magster/catalog";
import { loadActivePaymentMethods } from "@/lib/magster/payment-methods";
import { loadRegistrationCatalog } from "@/lib/magster/registration";
import { loadMagsterPublicSettings } from "@/lib/magster/settings";
import { RegistrationFlow } from "@/components/wizard/registration-flow";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
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
}
