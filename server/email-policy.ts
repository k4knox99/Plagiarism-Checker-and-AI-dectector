import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { domainToASCII } from "node:url";

export class EmailPolicyError extends Error {
  readonly code = "INVALID_EMAIL";
  constructor() {
    super("Enter a valid email address.");
    this.name = "EmailPolicyError";
  }
}

function validDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  const labels = domain.split(".");
  return labels.length >= 2 && labels.every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) &&
    /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(labels.at(-1)!);
}

function loadDisposableDomains() {
  let raw: string;
  try {
    // The static URL lets deployment file tracing include this versioned asset.
    raw = readFileSync(new URL("./data/disposable-domains.txt", import.meta.url), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("Email domain policy data is unavailable.");
    try {
      // Plain-Node compiled API smoke tests run from the repository root.
      raw = readFileSync(resolve(process.cwd(), "server/data/disposable-domains.txt"), "utf8");
    } catch {
      throw new Error("Email domain policy data is unavailable.");
    }
  }
  const domains = raw.split(/\r?\n/).map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (domains.length < 1000 || domains.some((domain) => !validDomain(domain)))
    throw new Error("Email domain policy data is invalid.");
  return new Set(domains);
}

// Read once per process, never fetch lists, resolve DNS, or contact third parties on signup.
const disposableDomains = loadDisposableDomains();

export type EmailAssessment = { email: string; domain: string; mailboxKey: string; isDisposable: boolean };

export function assessEmail(input: unknown): EmailAssessment {
  if (typeof input !== "string" || input.length > 1024 || /[\x00-\x1f\x7f]|\p{Cf}/u.test(input))
    throw new EmailPolicyError();
  const value = input.trim();
  const separator = value.indexOf("@");
  if (separator <= 0 || separator !== value.lastIndexOf("@")) throw new EmailPolicyError();
  const local = value.slice(0, separator).toLowerCase();
  const rawDomain = value.slice(separator + 1);
  if (local.length > 64 || !/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+$/.test(local) ||
    local.startsWith(".") || local.endsWith(".") || local.includes("..") ||
    /\s|[\/\\:#?%\[\]]/u.test(rawDomain) || rawDomain.endsWith("."))
    throw new EmailPolicyError();
  const domain = domainToASCII(rawDomain).toLowerCase();
  if (!validDomain(domain)) throw new EmailPolicyError();
  const email = `${local}@${domain}`;
  if (email.length > 254) throw new EmailPolicyError();

  // Only consumer Gmail has the documented dot/plus/googlemail equivalence here.
  // A custom domain hosted by Google is not equivalent to gmail.com.
  let canonicalMailbox = email;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const canonicalLocal = local.split("+", 1)[0].replace(/\./g, "");
    if (!/^[a-z0-9]+$/.test(canonicalLocal)) throw new EmailPolicyError();
    canonicalMailbox = `${canonicalLocal}@gmail.com`;
  }
  const mailboxKey = createHash("sha256").update("mailbox:v1\0" + canonicalMailbox).digest("hex");
  const labels = domain.split(".");
  let isDisposable = false;
  // Compare complete DNS labels, so sub.mailinator.com matches and mailinator.com.example does not.
  for (let i = 0; i < labels.length - 1; i++) {
    if (disposableDomains.has(labels.slice(i).join("."))) { isDisposable = true; break; }
  }
  return { email, domain, mailboxKey, isDisposable };
}
