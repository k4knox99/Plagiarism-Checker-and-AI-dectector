export async function readApiResponse(response: Response) {
  const type = response.headers.get("content-type") || "";
  const url = response.url;
  if (response.redirected && /https:\/\/(?:www\.)?vercel\.com\//.test(url)) {
    throw new Error(
      "This preview requires Vercel sign-in. Open the preview in your browser, sign in to Vercel, then reload this page.",
    );
  }
  if (!type.toLowerCase().includes("application/json")) {
    if (response.status === 401 || response.status === 403)
      throw new Error(
        "Access to this deployment is restricted. Sign in to Vercel and reload the preview, or use the public production website.",
      );
    if (response.status === 404 || response.ok)
      throw new Error(
        "The account API is not available at this address. The site owner needs to check the deployment routing.",
      );
    throw new Error(
      "The account server is temporarily unavailable. Please try again later or contact the site owner.",
    );
  }
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The account server sent an invalid response. Please try again later.",
    );
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error(
      "The account server sent an invalid response. Please try again later.",
    );
  if (!response.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "The request failed. Please try again.",
    );
  return data;
}
