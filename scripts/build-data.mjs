// Orchestrates all build-time data fetchers. Runs before `vite build` (npm
// "prebuild" hook). Each source is isolated: a failure or missing config logs a
// warning and keeps the last committed JSON, so the build NEVER breaks offline.
import { loadConfig, writeGenerated, log } from "./lib.mjs";
import { fetchGithub } from "./fetch-github.mjs";
import { fetchBlog } from "./fetch-blog.mjs";
import { fetchNotion, fetchWorkout } from "./fetch-notion.mjs";
import { fetchKnowledge } from "./fetch-knowledge.mjs";
import { fetchObsidian } from "./fetch-obsidian.mjs";

const TASKS = [
  { name: "github.json", run: fetchGithub },
  { name: "blog.json", run: fetchBlog },
  { name: "wellness.json", run: fetchNotion },
  { name: "graph.json", run: fetchObsidian },
  { name: "workout.json", run: fetchWorkout },
  // last: reads the JSON above and writes api/_knowledge.js for the chatbot
  { name: "chat knowledge", run: fetchKnowledge },
];

const cfg = await loadConfig();

for (const task of TASKS) {
  try {
    const data = await task.run(cfg);
    if (data) {
      await writeGenerated(task.name, data);
      log(`✓ wrote ${task.name}`);
    }
  } catch (err) {
    log(`! ${task.name} failed (keeping last good copy): ${err.message}`);
  }
}

log("done.");
