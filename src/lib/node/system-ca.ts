import tls from "node:tls";

let applied = false;

/**
 * This Windows machine's Node install does not trust the public CA chain
 * unless system certificates are loaded. Magster Supabase fetches fail with
 * UNABLE_TO_VERIFY_LEAF_SIGNATURE unless this runs (or `node --use-system-ca`).
 */
export function applySystemCaIfAvailable() {
  if (applied) return;
  applied = true;

  const tlsApi = tls as typeof tls & {
    getCACertificates?: (type?: string) => readonly string[];
    setDefaultCACertificates?: (certs: readonly string[]) => void;
  };

  if (
    typeof tlsApi.getCACertificates !== "function" ||
    typeof tlsApi.setDefaultCACertificates !== "function"
  ) {
    return;
  }

  try {
    tlsApi.setDefaultCACertificates([
      ...tlsApi.getCACertificates("default"),
      ...tlsApi.getCACertificates("system"),
    ]);
  } catch {
    // npm scripts still pass --use-system-ca as a fallback.
  }
}