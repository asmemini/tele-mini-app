import { MagsterRpc, MagsterTables } from "@/lib/magster/tables";
import { asNumber, asRecord, asString } from "@/lib/magster/parse";
import type { MagsterPaymentMethod } from "@/lib/magster/types";
import { getMagsterSupabase } from "@/lib/supabase/server";

function mapPaymentMethod(item: Record<string, unknown>, fallbackId = 0): MagsterPaymentMethod {
  const slug = asString(item.slug || item.id).trim();
  return {
    id: asNumber(item.numeric_id) || fallbackId,
    slug,
    name: asString(item.name).trim(),
    accountHolder: asString(item.accountHolder || item.account_holder).trim(),
    accountNumber: asString(item.accountNumber || item.account_number).trim(),
    sortOrder: asNumber(item.sortOrder ?? item.sort_order),
    isActive: item.is_active !== false,
  };
}

function mergeMethods(
  primary: MagsterPaymentMethod[],
  secondary: MagsterPaymentMethod[],
): MagsterPaymentMethod[] {
  const bySlug = new Map<string, MagsterPaymentMethod>();
  for (const method of secondary) {
    if (method.slug) bySlug.set(method.slug, method);
  }
  for (const method of primary) {
    const existing = bySlug.get(method.slug);
    bySlug.set(method.slug, {
      ...existing,
      ...method,
      accountHolder: method.accountHolder || existing?.accountHolder || "",
      accountNumber: method.accountNumber || existing?.accountNumber || "",
      name: method.name || existing?.name || "",
    });
  }
  return [...bySlug.values()]
    .filter((method) => method.slug && method.name && method.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

async function loadFromTable(): Promise<MagsterPaymentMethod[]> {
  const { data, error } = await getMagsterSupabase()
    .from(MagsterTables.paymentMethods)
    .select("id, slug, name, account_holder, account_number, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row, index) => {
    const item = row as Record<string, unknown>;
    return mapPaymentMethod({ ...item, numeric_id: item.id }, index + 1);
  });
}

async function loadFromAppEdits(): Promise<MagsterPaymentMethod[]> {
  const { data, error } = await getMagsterSupabase().rpc(MagsterRpc.getAppEditsConfig);
  if (error || !data) return [];
  const payload = asRecord(data);
  const rows = Array.isArray(payload.paymentMethods) ? payload.paymentMethods : [];
  return rows.map((row, index) => mapPaymentMethod(asRecord(row), index + 1));
}

/**
 * Same Magster Admin payment accounts used by the Flutter Student App:
 * `get_app_edits_config` plus `app_payment_methods`.
 */
export async function loadActivePaymentMethods(): Promise<MagsterPaymentMethod[]> {
  const fromTable = await loadFromTable();
  try {
    const fromRpc = await loadFromAppEdits();
    if (fromRpc.length) return mergeMethods(fromRpc, fromTable);
  } catch {
    // Fall through to the table, which is Magster Admin's source of truth.
  }
  return fromTable;
}
