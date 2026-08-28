import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/legal/legal-document";
import { isMagsterLegalSlug, loadMagsterLegalPage } from "@/lib/magster/legal";

export const dynamic = "force-dynamic";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isMagsterLegalSlug(slug)) notFound();
  const page = await loadMagsterLegalPage(slug);
  return <LegalDocument title={page.title} body={page.body} />;
}
