import { google } from "googleapis";
import { CodeChallengeMethod } from "google-auth-library";

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
  return buildYoutubeAuthUrlWithPkce(state);
}

export function buildYoutubeAuthUrlWithPkce(state: string, codeChallenge?: string) {
  const client = getYoutubeOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
    prompt: "consent",
    state,
    include_granted_scopes: true,
    ...(codeChallenge
      ? {
          code_challenge_method: CodeChallengeMethod.S256,
          code_challenge: codeChallenge,
        }
      : {}),
  });
}
