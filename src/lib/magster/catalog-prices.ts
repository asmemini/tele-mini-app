import { MagsterTables } from "@/lib/magster/tables";
import { asNumber } from "@/lib/magster/parse";
import { getMagsterSupabase } from "@/lib/supabase/server";

export async function loadPurchasablePrices(input: {
  courseIds: number[];
  bundleIds: number[];
}): Promise<{ total: number; courseIds: number[]; bundleIds: number[] }> {
  const client = getMagsterSupabase();
  const uniqueCourses = [...new Set(input.courseIds.filter((id) => id > 0))];
  const uniqueBundles = [...new Set(input.bundleIds.filter((id) => id > 0))];
  let total = 0;

  if (uniqueCourses.length) {
    const { data, error } = await client
      .from(MagsterTables.courses)
      .select("id, price, is_active, is_hidden, is_bundle_only, availability")
      .in("id", uniqueCourses);
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length !== uniqueCourses.length) {
      throw new Error("One or more selected courses are no longer available.");
    }
    for (const row of rows) {
      const item = row as Record<string, unknown>;
      if (item.is_active !== true || item.is_hidden === true) {
        throw new Error("One or more selected courses are no longer available.");
      }
      if (item.is_bundle_only === true || String(item.availability) === "upcoming") {
        throw new Error("One or more selected courses cannot be purchased yet.");
      }
      const price = asNumber(item.price);
      if (price <= 0) throw new Error("Invalid course price.");
      total += price;
    }
  }

  if (uniqueBundles.length) {
    const { data, error } = await client
      .from(MagsterTables.bundles)
      .select("id, price, is_active, is_hidden, availability")
      .in("id", uniqueBundles);
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length !== uniqueBundles.length) {
      throw new Error("One or more selected bundles are no longer available.");
    }
    for (const row of rows) {
      const item = row as Record<string, unknown>;
      if (item.is_active !== true || item.is_hidden === true) {
        throw new Error("One or more selected bundles are no longer available.");
      }
      if (String(item.availability) === "upcoming") {
        throw new Error("One or more selected bundles cannot be purchased yet.");
      }
      const price = asNumber(item.price);
      if (price <= 0) throw new Error("Invalid bundle price.");
      total += price;
    }
  }

  if (!uniqueCourses.length && !uniqueBundles.length) {
    throw new Error("Please select at least one course or bundle.");
  }

  return { total, courseIds: uniqueCourses, bundleIds: uniqueBundles };
}
