import { NextResponse } from "next/server";
import { isMagsterLegalSlug, loadMagsterLegalPage } from "@/lib/magster/legal";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isMagsterLegalSlug(slug)) {
    return NextResponse.json({ ok: false, message: "Legal page not found." }, { status: 404 });
  }
  const page = await loadMagsterLegalPage(slug);
  return NextResponse.json({ ok: true, page });
}
