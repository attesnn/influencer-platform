import crypto from "crypto";

type SignedStatePayload = {
  appUserId: string;
  t: number;
  nonce: string;
};

function getSigningSecret() {
  const secret = process.env.YOUTUBE_OAUTH_STATE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("YOUTUBE_OAUTH_STATE_SECRET must be at least 32 chars");
  }
  return secret;
}

export function createSignedYoutubeState(appUserId: string) {
  const payload: SignedStatePayload = {
    appUserId,
    t: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const payloadSegment = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signatureSegment = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadSegment)
    .digest("base64url");
  return `${payloadSegment}.${signatureSegment}`;
}

export function verifySignedYoutubeState(state: string, maxAgeMs = 10 * 60 * 1000) {
  const [payloadSegment, signatureSegment] = state.split(".");
  if (!payloadSegment || !signatureSegment) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadSegment)
    .digest("base64url");

  const actualBuffer = Buffer.from(signatureSegment);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  let parsed: SignedStatePayload;
  try {
    parsed = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8")) as SignedStatePayload;
  } catch {
    return null;
  }

  if (!parsed.appUserId || !parsed.t || typeof parsed.appUserId !== "string") {
    return null;
  }
  if (Date.now() - parsed.t > maxAgeMs) {
    return null;
  }

  return parsed;
}

export function requestHasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  const allowedOrigins = new Set<string>([new URL(request.url).origin]);
  if (process.env.APP_BASE_URL) {
    allowedOrigins.add(process.env.APP_BASE_URL);
  }

  return allowedOrigins.has(origin);
}

export function getSafeRedirectPath(candidate: string | null) {
  if (!candidate) {
    return "/dashboard";
  }
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/dashboard";
  }
  return candidate;
}
