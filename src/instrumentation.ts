export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { applySystemCaIfAvailable } = await import("@/lib/node/system-ca");
  applySystemCaIfAvailable();
}