import { MagsterRpc } from "@/lib/magster/tables";
import { normalizeEthiopianPhone } from "@/lib/magster/phone";
import { getMagsterSupabase } from "@/lib/supabase/server";
import type { MiniAppStudentResume } from "@/lib/magster/entitlements";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asIdList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((item) => Number(item))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ];
}

export async function loadMiniAppResumeByTelegram(
  telegramUserId: number,
): Promise<MiniAppStudentResume | null> {
  if (!Number.isFinite(telegramUserId) || telegramUserId <= 0) return null;

  const { data, error } = await getMagsterSupabase().rpc(
    MagsterRpc.miniAppSessionByTelegram,
    { p_telegram_user_id: telegramUserId },
  );

  if (error) {
    console.warn("mini_app_session_by_telegram failed:", error.message);
    return null;
  }

  const parsed =
    typeof data === "string"
      ? (() => {
          try {
            return JSON.parse(data) as unknown;
          } catch {
            return null;
          }
        })()
      : data;
  const map = asRecord(parsed);
  if (map.success !== true || map.linked !== true) return null;

  const student = asRecord(map.student);
  const studentId = Number(student.id);
  if (!Number.isFinite(studentId) || studentId <= 0) return null;

  return {
    studentId,
    profileComplete: map.profileComplete === true,
    fullName: String(student.fullName ?? "").trim(),
    phone: normalizeEthiopianPhone(String(student.phone ?? "")),
    gender: String(student.gender ?? "").trim(),
    academicYear: String(student.academicYear ?? "").trim(),
    institution: String(student.institution ?? "").trim(),
    ownedCourseIds: asIdList(map.ownedCourseIds),
    ownedBundleIds: asIdList(map.ownedBundleIds),
  };
}
