export function trustedOrigins(options: {
  appOrigin?: string;
  vercelHost?: string;
  vercelBranchHost?: string;
  production: boolean;
  localOrigin: string;
}) {
  const origins = new Set<string>();
  if (options.appOrigin) {
    try {
      origins.add(new URL(options.appOrigin).origin);
    } catch {
      /* Invalid configuration fails closed. */
    }
  }
  // These exact deployment/branch hosts come from platform configuration,
  // never request headers. Other projects' vercel.app hosts remain untrusted.
  for (const host of [options.vercelHost, options.vercelBranchHost]) {
    if (host && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.vercel\.app$/i.test(host))
      origins.add(`https://${host.toLowerCase()}`);
  }
  if (!options.production) origins.add(options.localOrigin);
  return origins;
}
