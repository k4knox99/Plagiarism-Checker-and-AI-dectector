import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const sha = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(sha || ""))
  throw new Error("Supply a reviewed, full lowercase upstream Git commit SHA.");
const repository = "disposable-email-domains/disposable-email-domains";
async function publicText(url) {
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15000), headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) throw new Error(`Public upstream download failed (${response.status}). Existing data was not changed.`);
  const text = await response.text();
  if (text.length > 2_000_000) throw new Error("Upstream response exceeds the review limit.");
  return text;
}
const metadata = JSON.parse(await publicText(`https://api.github.com/repos/${repository}/commits/${sha}`));
if (metadata.sha !== sha || typeof metadata.commit?.committer?.date !== "string")
  throw new Error("Could not verify the upstream commit metadata.");
const [raw, license] = await Promise.all([
  publicText(`https://raw.githubusercontent.com/${repository}/${sha}/disposable_email_blocklist.conf`),
  publicText(`https://raw.githubusercontent.com/${repository}/${sha}/LICENSE.txt`),
]);
if (!license.startsWith("CC0 1.0 Universal")) throw new Error("The upstream license changed; review it manually before updating.");
const domains = raw.trimEnd().split(/\r?\n/);
if (domains.length < 1000 || domains.length > 100000 || domains.some((domain) =>
  !/^[a-z0-9.-]+$/.test(domain) || !domain.includes(".") || domain.split(".").some((label) =>
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) || new Set(domains).size !== domains.length)
  throw new Error("The upstream data shape changed; review it manually before updating.");
for (const required of ["mailinator.com", "guerrillamail.com", "10minutemail.com"])
  if (!domains.includes(required)) throw new Error("Core disposable-provider entries are missing; review the new snapshot manually.");
const header = `# Vendored ${repository}\n# Source commit: ${sha}\n# Source date: ${metadata.commit.committer.date}\n# Retrieved: ${new Date().toISOString().slice(0, 10)}\n# Source: https://raw.githubusercontent.com/${repository}/${sha}/disposable_email_blocklist.conf\n# Upstream license follows; domain data below is otherwise unchanged.\n${license.trim().split("\n").map((line) => line.trimEnd() ? "# " + line.trimEnd() : "#").join("\n")}\n# BEGIN UPSTREAM DOMAIN DATA\n`;
const destination = new URL("../server/data/disposable-domains.txt", import.meta.url);
await mkdir(new URL("../server/data/", import.meta.url), { recursive: true });
await writeFile(destination, header + raw, "utf8");
console.log(`Updated ${domains.length} bundled domains at ${fileURLToPath(destination)} from ${sha}. Review the diff and update docs/email-policy-source.md before committing.`);
