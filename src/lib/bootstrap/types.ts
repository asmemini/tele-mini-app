import type { MiniAppConfig } from "@/lib/config/mini-app-config";
import type {
  MagsterCatalog,
  MagsterPaymentMethod,
  RegistrationCatalog,
} from "@/lib/magster/types";

export type BootstrapPayload = {
  ok: boolean;
  message?: string;
  config?: MiniAppConfig;
  catalog?: MagsterCatalog;
  paymentMethods?: MagsterPaymentMethod[];
  registration?: RegistrationCatalog;
};
