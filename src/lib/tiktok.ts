const TIKTOK_AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

function getTiktokEnv() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !clientSecret || !redirectUri) {
    throw new Error("TikTok OAuth env vars are missing");
  }
  return { clientKey, clientSecret, redirectUri };
}

export function buildTiktokAuthUrl(state: string) {
  const { clientKey, redirectUri } = getTiktokEnv();
  const url = new URL(TIKTOK_AUTH_BASE);
  url.searchParams.set("client_key", clientKey);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "user.info.basic");
  url.searchParams.set("state", state);
  return url.toString();
}

type TiktokTokenResponse = {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

export async function exchangeTiktokCodeForToken(code: string) {
  const { clientKey, clientSecret, redirectUri } = getTiktokEnv();
  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const response = await fetch(`${TIKTOK_API_BASE}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed TikTok code exchange");
  }
  return (await response.json()) as TiktokTokenResponse;
}

type TiktokUserInfoResponse = {
  data?: {
    user?: {
      open_id?: string;
      display_name?: string;
      avatar_url?: string;
      profile_deep_link?: string;
    };
  };
};

export async function fetchTiktokUserInfo(accessToken: string) {
  const response = await fetch(
    `${TIKTOK_API_BASE}/user/info/?fields=open_id,display_name,avatar_url,profile_deep_link`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch TikTok profile");
  }
  return (await response.json()) as TiktokUserInfoResponse;
}
