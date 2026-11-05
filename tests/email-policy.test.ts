import { test } from "node:test";
import assert from "node:assert/strict";
import { domainToUnicode } from "node:url";
import { assessEmail, EmailPolicyError } from "../server/email-policy.js";

test("bundled disposable domain data blocks known providers and their subdomains", () => {
  for (const domain of ["mailinator.com", "guerrillamail.com", "guerrillamail.org", "10minutemail.com", "temp-mail.org", "tempmailo.com"]) {
    assert.equal(assessEmail(`reader@${domain}`).isDisposable, true, domain);
    assert.equal(assessEmail(`reader@INBOX.${domain.toUpperCase()}`).isDisposable, true, domain);
  }
});

test("disposable checks use whole DNS labels rather than keywords or substring matches", () => {
  for (const domain of ["companymailinator.example", "mailinator.com.example", "mytemporarycompany.example", "tempest.example", "temporary-research.example"])
    assert.equal(assessEmail(`reader@${domain}`).isDisposable, false, domain);
});

test("common permanent providers and privacy relays remain usable", () => {
  for (const domain of ["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "fastmail.com", "proton.me", "protonmail.com", "mozmail.com", "duck.com", "simplelogin.com", "simplelogin.co", "simplelogin.io", "slmail.me", "addy.io", "anonaddy.com", "privaterelay.appleid.com"])
    assert.equal(assessEmail(`reader@${domain}`).isDisposable, false, domain);
});

test("address normalization handles case and IDN domains before exact or subdomain checks", () => {
  assert.equal(assessEmail(" Reader+News@EXAMPLE.COM ").email, "reader+news@example.com");
  const idn = assessEmail("Reader@bücher.example");
  assert.equal(idn.domain, "xn--bcher-kva.example");
  assert.equal(idn.email, "reader@xn--bcher-kva.example");
  assert.equal(idn.mailboxKey, assessEmail("reader@xn--bcher-kva.example").mailboxKey);
  const unicodeBlocked = domainToUnicode("xn--5nx.cc");
  assert.equal(assessEmail(`reader@${unicodeBlocked}`).isDisposable, true);
  assert.equal(assessEmail(`reader@sub.${unicodeBlocked}`).isDisposable, true);
});

test("Gmail dots, tags, case, and googlemail share one opaque mailbox key", () => {
  const baseline = assessEmail("janesmith@gmail.com");
  for (const email of ["Jane.Smith@gmail.com", "j.a.n.e.s.m.i.t.h+newsletter@GMAIL.COM", "janesmith+one+two@googlemail.com"])
    assert.equal(assessEmail(email).mailboxKey, baseline.mailboxKey);
  assert.match(baseline.mailboxKey, /^[a-f0-9]{64}$/);
  assert.ok(!baseline.mailboxKey.includes("janesmith"));
  assert.equal(assessEmail("Jane.Smith+News@googlemail.com").email, "jane.smith+news@googlemail.com");
});

test("other providers and custom domains preserve plus tags and dots for mailbox identity", () => {
  for (const domain of ["outlook.com", "yahoo.com", "mycompany.example", "mozmail.com"]) {
    assert.notEqual(assessEmail(`jane+news@${domain}`).mailboxKey, assessEmail(`jane@${domain}`).mailboxKey);
    assert.notEqual(assessEmail(`jane.smith@${domain}`).mailboxKey, assessEmail(`janesmith@${domain}`).mailboxKey);
  }
});

test("unsupported or malformed addresses fail with a generic non-PII validation error", () => {
  const bad: unknown[] = [null, undefined, 123, {}, [], "", "reader", "@example.com", "reader@", "a@@example.com", "reader@localhost", "a b@example.com", "a@example .com", "reader@example.com.", ".reader@example.com", "reader.@example.com", "a..b@example.com", '"reader"@example.com', "Name <reader@example.com>", "a@example.com\nBcc:x@y.com", "a@example.com\t", "a@127.0.0.1", "a@[127.0.0.1]", "a@-example.com", "a@example-.com", "a@example..com", "a@exa_mple.com", "a@https://example.com", "a@example.com:443", "a@example.com/path", "a@example.com?x=1", "a@example.com#fragment", "a@exam\u200bple.com", "üser@example.com", "+tag@gmail.com", "a".repeat(65) + "@example.com", "a@" + "b".repeat(64) + ".com"];
  for (const value of bad)
    assert.throws(() => assessEmail(value), (error) => error instanceof EmailPolicyError && error.code === "INVALID_EMAIL" && error.message === "Enter a valid email address.", String(value));
});
