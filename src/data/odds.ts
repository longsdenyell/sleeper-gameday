// Calls your serverless /api/odds (so client never sees the key)
export async function getOdds() {
  const r = await fetch("/api/odds");
  if (!r.ok) throw new Error("odds failed");
  return r.json();
}
