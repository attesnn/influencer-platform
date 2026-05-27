const META_GRAPH_API_VERSION = "v20.0";

function getMetaEnv() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) {
    throw new Error("Meta OAuth env vars are missing");
  }
  return { appId, appSecret, redirectUri };
}

export function buildMetaAuthUrl(state: string) {
  const { appId, redirectUri } = getMetaEnv();
  const url = new URL("https://www.facebook.com/v20.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "public_profile,pages_show_list,instagram_basic");
  url.searchParams.set("state", state);
  return url.toString();
}

type MetaTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type MetaMeResponse = {
  id: string;
  name?: string;
};

export async function exchangeMetaCodeForToken(code: string) {
  const { appId, appSecret, redirectUri } = getMetaEnv();
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed Meta code exchange");
  }
  return (await response.json()) as MetaTokenResponse;
}

export async function fetchMetaMe(accessToken: string) {
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/me`);
  url.searchParams.set("fields", "id,name");
  url.searchParams.set("access_token", accessToken);
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch Meta profile");
  }
  return (await response.json()) as MetaMeResponse;
}

export async function revokeMetaPermissions(accessToken: string) {
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/me/permissions`);
  url.searchParams.set("access_token", accessToken);
  await fetch(url, { method: "DELETE", cache: "no-store" });
}
