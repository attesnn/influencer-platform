import { google } from "googleapis";

export function getYoutubeOAuthClient() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("YouTube OAuth env vars are missing");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function buildYoutubeAuthUrl(state: string) {
  const client = getYoutubeOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
    prompt: "consent",
    state,
  });
}
