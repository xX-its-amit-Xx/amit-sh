// Daily rebuild (Vercel Cron → this function → Deploy Hook).
// The site is static, so fresh Substack posts / GitHub repos only appear after a
// rebuild. vercel.json schedules this at 12:00 UTC; it pings the project's Deploy
// Hook, which rebuilds production from `main` (re-running scripts/build-data.mjs).
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   DEPLOY_HOOK_URL — from Settings → Git → Deploy Hooks (branch: main)
//   CRON_SECRET     — any random string; Vercel sends it with cron requests so
//                     strangers can't trigger rebuilds
export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!process.env.DEPLOY_HOOK_URL) return res.status(200).json({ skipped: "DEPLOY_HOOK_URL not set" });
  const r = await fetch(process.env.DEPLOY_HOOK_URL, { method: "POST" });
  return res.status(r.ok ? 200 : 502).json({ triggered: r.ok, status: r.status });
}
