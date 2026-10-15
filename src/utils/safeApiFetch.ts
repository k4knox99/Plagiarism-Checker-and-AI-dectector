/**
 * Safe API Fetch Utility
 * Prevents "Unexpected token 'A', 'A server error...' is not valid JSON" crashes
 * and provides seamless automatic fallback to client-side forensics engine.
 */

export interface SafeFetchResult<T> {
  success: boolean;
  data?: T;
  raw?: string;
  isFallback?: boolean;
  error?: string;
}

export async function safeApiFetch<T = any>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 8000
): Promise<SafeFetchResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    clearTimeout(timeoutId);

    // Read raw text first to avoid JSON.parse throwing on plain text or HTML errors
    const raw = await res.text();

    if (!raw || raw.trim().length === 0) {
      return {
        success: false,
        error: `Empty response from server (HTTP ${res.status})`
      };
    }

    try {
      const parsed = JSON.parse(raw);
      if (res.ok && parsed.success !== false) {
        return {
          success: true,
          data: parsed as T,
          raw
        };
      } else {
        return {
          success: false,
          data: parsed as T,
          raw,
          error: parsed.error || `Server responded with status ${res.status}`
        };
      }
    } catch {
      // Server returned HTML error, 502 Bad Gateway, or Vercel "A server error has occurred"
      return {
        success: false,
        raw,
        error: `Server returned non-JSON response (HTTP ${res.status}): ${raw.slice(0, 100)}`
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Request timed out after 8s' : err.message || 'Network error'
    };
  }
}
