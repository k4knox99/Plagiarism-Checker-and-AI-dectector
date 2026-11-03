export function trustedOrigins(options: {
  appOrigin?: string;
  vercelHost?: string;
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
  // VERCEL_URL is set by the platform for this deployment, never by a request.
  if (
    options.vercelHost &&
    /^[a-z0-9-]+\.vercel\.app$/i.test(options.vercelHost)
  )
    origins.add(`https://${options.vercelHost.toLowerCase()}`);
  if (!options.production) origins.add(options.localOrigin);
  return origins;
}
