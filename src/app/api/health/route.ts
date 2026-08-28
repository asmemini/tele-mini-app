import { NextResponse } from "next/server";
import { getMagsterSupabase } from "@/lib/supabase/server";
import { MagsterTables } from "@/lib/magster/tables";

export async function GET() {
  try {
    const client = getMagsterSupabase();
    const { error } = await client.from(MagsterTables.courses).select("id").limit(1);
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      project: "mrzmhtirmxqnnoqppnyf",
      source: "existing Magster Supabase project",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
