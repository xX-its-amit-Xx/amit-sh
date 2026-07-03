// Pull repos from GitHub at build time.
//   featured = repos you OWN and have STARRED (star your own repo to feature it) → rotating carousel
//   all      = all your public source repos, newest first → full list further down
import { fetchJson, log } from "./lib.mjs";

function slimRepo(r) {
  return {
    name: r.name,
    description: r.description || "",
    url: r.html_url,
    homepage: r.homepage || null,
    stars: r.stargazers_count,
    language: r.language || null,
    topics: r.topics || [],
    updated: r.updated_at,
  };
}

export async function fetchGithub(cfg) {
  const gh = cfg.github || {};
  const user = gh.user;
  if (!user) {
    log("github: no user configured, skipping");
    return null;
  }
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // all owned repos
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await fetchJson(
      `https://api.github.com/users/${user}/repos?per_page=100&page=${page}&sort=updated&type=owner`,
      headers
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }

  // starred repos (may include other people's) → keep only ones this user owns
  const starred = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await fetchJson(
      `https://api.github.com/users/${user}/starred?per_page=100&page=${page}`,
      headers
    );
    starred.push(...batch);
    if (batch.length < 100) break;
  }
  const ownStarredNames = new Set(
    starred.filter((r) => (r.owner?.login || "").toLowerCase() === user.toLowerCase()).map((r) => r.name)
  );

  const usable = repos.filter(
    (r) => (gh.includeForks || !r.fork) && (gh.includeArchived || !r.archived)
  );

  const featured = usable
    .filter((r) => ownStarredNames.has(r.name))
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .map(slimRepo);

  const all = usable
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, gh.maxAll || 30)
    .map(slimRepo);

  log(`github: ${featured.length} featured (own+starred), ${all.length} total`);
  return { featured, all, fetchedAt: new Date().toISOString() };
}
