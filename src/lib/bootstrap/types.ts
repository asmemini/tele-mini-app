import type { MiniAppConfig } from "@/lib/config/mini-app-config";
import type {
  MagsterCatalog,
  MagsterPaymentMethod,
  RegistrationCatalog,
} from "@/lib/magster/types";

export type MiniAppResumePayload = {
  studentId: number;
  profileComplete: boolean;
  fullName: string;
  phone: string;
  gender: string;
  academicYear: string;
  institution: string;
  ownedCourseIds: number[];
  ownedBundleIds: number[];
};

export type BootstrapPayload = {
  ok: boolean;
  message?: string;
  config?: MiniAppConfig;
  catalog?: MagsterCatalog;
  paymentMethods?: MagsterPaymentMethod[];
  registration?: RegistrationCatalog;
  resume?: MiniAppResumePayload | null;
};
