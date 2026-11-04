# Writing tools and design references

This workspace uses its own interface and implementation. Feature research informed the workflow; proprietary models, databases, branding, and product code were not copied.

| Tool | Evidence shown | Scope |
| --- | --- | --- |
| AI detector | Sentence signals, summary, engine label | An estimate, not proof of authorship |
| Plagiarism checker | URLs present in provider search metadata | Incomplete public-web coverage, not a proprietary academic index |
| Humanize & rewrite | Original/revised text, edit notes, preservation warnings | Voice, audience, length, and protected terms remain under the user's control |
| Grammar & clarity | Corrected draft, explained suggestions, reading counts | Contextual model review when available; clearly labeled basic rules otherwise |
| Summarizer | Summary, key points, and outline | Uses supplied text; check qualifications and factual fidelity |
| Compare documents | Exact source excerpts and original text offsets | Five-word phrases, directional coverage, optional quote/reference exclusions |
| Citation builder | APA, MLA, Chicago, BibTeX, missing-data notes | Manual webpage metadata, draft formatting, no invented bibliography |

Saved results stay attached to the exact original draft. Editing or applying a revision clears stale results. API validation, verification gates, request limits, and ownership checks apply to every tool. Model inputs are treated as untrusted document data. No detector-evasion score or claim of superiority is generated.

## Primary references

- [Plagiarism Checker X features](https://plagiarismcheckerx.com/features) and [bulk comparison](https://plagiarismcheckerx.com/bulk-comparison): source comparison and passage review.
- [GPTZero Feedback](https://support.gptzero.me/articles/6324439350-what-is-feedback): explained grammar, fluency, and clarity suggestions.
- [Grammarly Humanizer guide](https://support.grammarly.com/hc/en-us/articles/38552339652109-Humanizer-user-guide), [summarizer](https://www.grammarly.com/ai/ai-writing-tools/summarizing-tool), and [citation generator](https://www.grammarly.com/citations): voice controls and focused writing workflows.
- GitHub projects reviewed: [jsdiff](https://github.com/kpdecker/jsdiff) (BSD-3-Clause), [retext-readability](https://github.com/retextjs/retext-readability) (MIT), [Citation.js](https://github.com/citation-js/citation-js) (MIT), and [LanguageTool](https://github.com/languagetool-org/languagetool) (LGPL core, with separately licensed resources). These packages are not bundled by this revision; the deterministic tools have an independent implementation.
- [Vercel OIDC](https://vercel.com/docs/oidc) and [AI Gateway OIDC](https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc): request-scoped authentication for deployed Functions.

The implementation has not been benchmarked against these commercial products. Broader language coverage, proprietary source collections, and detector accuracy require separate evaluation and infrastructure.
