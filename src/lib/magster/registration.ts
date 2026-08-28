import { DEFAULT_STREAM } from "@/lib/constants/auth";
import { MagsterRpc, MagsterTables } from "@/lib/magster/tables";
import { asString } from "@/lib/magster/parse";
import { normalizeEthiopianPhone } from "@/lib/magster/phone";
import type { RegistrationCatalog, RegistrationOption } from "@/lib/magster/types";
import { getMagsterSupabase } from "@/lib/supabase/server";
import { validationMessages } from "@/lib/validation/registration";

const FALLBACK_CATALOG: RegistrationCatalog = {
  streams: [{ name: "Natural Science" }, { name: "Social Science" }],
  academicYears: [
    { name: "First Year" },
    { name: "Second Year" },
    { name: "Third Year" },
    { name: "High School" },
  ],
  institutions: [
    { name: "Addis Ababa University" },
    { name: "Addis Ababa Science and Technology University" },
    { name: "Adama Science and Technology University" },
    { name: "Bahir Dar University" },
    { name: "Hawassa University" },
    { name: "Jimma University" },
    { name: "Mekelle University" },
    { name: "University of Gondar" },
  ],
};

function optionsFor(
  rows: Array<{ category?: unknown; name?: unknown; sort_order?: unknown }>,
  category: string,
): RegistrationOption[] {
  return rows
    .filter((row) => String(row.category ?? "") === category && asString(row.name).trim())
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((row) => ({ name: asString(row.name).trim() }));
}

export async function loadRegistrationCatalog(): Promise<RegistrationCatalog> {
  const client = getMagsterSupabase();
  const { data, error } = await client
    .from(MagsterTables.appRegistrationOptions)
    .select("category, name, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return FALLBACK_CATALOG;

  const rows = data as Array<{ category?: unknown; name?: unknown; sort_order?: unknown }>;
  const academicYears = optionsFor(rows, "academic_year");
  const institutions = optionsFor(rows, "institution");
  const streams = optionsFor(rows, "stream");
  if (!academicYears.length || !institutions.length) return FALLBACK_CATALOG;
  return {
    academicYears,
    institutions,
    streams: streams.length ? streams : FALLBACK_CATALOG.streams,
  };
}

export function resolveDefaultStream(catalog: RegistrationCatalog): string {
  if (catalog.streams.some((item) => item.name === DEFAULT_STREAM)) {
    return DEFAULT_STREAM;
  }
  return catalog.streams[0]?.name || DEFAULT_STREAM;
}

/**
 * Magster Student App uses the same `students.phone_number` lookup.
 * Returns only the id so Mini App never leaks student records to the browser.
 */
export async function findMagsterStudentIdByPhone(phone: string): Promise<number | null> {
  const normalized = normalizeEthiopianPhone(phone);
  if (!/^[79]\d{8}$/.test(normalized)) return null;

  const client = getMagsterSupabase();
  const { data, error } = await client
    .from(MagsterTables.students)
    .select("id, phone_number")
    .or(
      [
        `phone_number.eq.${normalized}`,
        `phone_number.eq.251${normalized}`,
        `phone_number.eq.0${normalized}`,
      ].join(","),
    )
    .limit(8);

  if (error) throw error;

  const match = (data ?? []).find((row) => {
    const stored = normalizeEthiopianPhone(asString((row as { phone_number?: unknown }).phone_number));
    return stored === normalized;
  });
  const id = Number((match as { id?: unknown } | undefined)?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function isPhoneTakenForNewRegistration(
  phone: string,
  currentStudentId: number | null,
): Promise<boolean> {
  const existingId = await findMagsterStudentIdByPhone(phone);
  if (!existingId) return false;
  if (currentStudentId && existingId === currentStudentId) return false;
  return true;
}

const AUTH_MESSAGES = {
  phoneRegistered: validationMessages.phoneTaken,
  registrationFailed: "Registration failed. Please try again.",
  invalidPin: "PIN must contain exactly 4 digits.",
  deviceIneligible: "This device cannot create another Magster account.",
} as const;

export type RegisterResult =
  | { ok: true; studentId: number }
  | { ok: false; code: string; message: string };

function asMap(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function registerMagsterStudent(input: {
  fullName: string;
  phone: string;
  gender: string;
  academicYear: string;
  institution: string;
  stream: string;
  pin: string;
  deviceId: string;
  termsAccepted: boolean;
}): Promise<RegisterResult> {
  const { data, error } = await getMagsterSupabase().rpc(MagsterRpc.registerStudentSecure, {
    p_full_name: input.fullName.trim(),
    p_phone: normalizeEthiopianPhone(input.phone),
    p_pin: input.pin,
    p_gender: input.gender,
    p_stream: input.stream,
    p_academic_year: input.academicYear,
    p_institution: input.institution,
    p_device_id: input.deviceId,
    p_terms_accepted: input.termsAccepted,
  });

  if (error) {
    console.error("register_student_secure failed:", error.message);
    return { ok: false, code: "server_error", message: AUTH_MESSAGES.registrationFailed };
  }

  const map = asMap(data);
  if (map.success === true) {
    const studentId = Number(map.student_id);
    if (!Number.isFinite(studentId) || studentId <= 0) {
      return { ok: false, code: "server_error", message: AUTH_MESSAGES.registrationFailed };
    }
    return { ok: true, studentId };
  }

  const code = String(map.error ?? "server_error");
  if (code === "phone_registered") {
    return { ok: false, code, message: AUTH_MESSAGES.phoneRegistered };
  }
  if (code === "invalid_pin") {
    return { ok: false, code, message: AUTH_MESSAGES.invalidPin };
  }
  if (code === "device_ineligible") {
    return { ok: false, code, message: AUTH_MESSAGES.deviceIneligible };
  }
  return { ok: false, code, message: AUTH_MESSAGES.registrationFailed };
}
