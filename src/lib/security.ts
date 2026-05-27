import crypto from "crypto";

type SignedStatePayload = {
  appUserId: string;
  t: number;
  nonce: string;
};

function getSigningSecret(
  envKey: "YOUTUBE_OAUTH_STATE_SECRET" | "META_OAUTH_STATE_SECRET" | "TIKTOK_OAUTH_STATE_SECRET",
) {
  const secret = process.env[envKey];
  if (!secret || secret.length < 32) {
    throw new Error(`${envKey} must be at least 32 chars`);
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
    .createHmac("sha256", getSigningSecret("YOUTUBE_OAUTH_STATE_SECRET"))
    .update(payloadSegment)
    .digest("base64url");
  return `${payloadSegment}.${signatureSegment}`;
}

function verifySignedState(
  state: string,
  envKey: "YOUTUBE_OAUTH_STATE_SECRET" | "META_OAUTH_STATE_SECRET" | "TIKTOK_OAUTH_STATE_SECRET",
  maxAgeMs = 10 * 60 * 1000,
) {
  const [payloadSegment, signatureSegment] = state.split(".");
  if (!payloadSegment || !signatureSegment) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", getSigningSecret(envKey))
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

export function verifySignedYoutubeState(state: string, maxAgeMs = 10 * 60 * 1000) {
  return verifySignedState(state, "YOUTUBE_OAUTH_STATE_SECRET", maxAgeMs);
}

export function createSignedMetaState(appUserId: string) {
  const payload: SignedStatePayload = {
    appUserId,
    t: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const payloadSegment = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signatureSegment = crypto
    .createHmac("sha256", getSigningSecret("META_OAUTH_STATE_SECRET"))
    .update(payloadSegment)
    .digest("base64url");
  return `${payloadSegment}.${signatureSegment}`;
}

export function verifySignedMetaState(state: string, maxAgeMs = 10 * 60 * 1000) {
  return verifySignedState(state, "META_OAUTH_STATE_SECRET", maxAgeMs);
}

export function createSignedTiktokState(appUserId: string) {
  const payload: SignedStatePayload = {
    appUserId,
    t: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const payloadSegment = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signatureSegment = crypto
    .createHmac("sha256", getSigningSecret("TIKTOK_OAUTH_STATE_SECRET"))
    .update(payloadSegment)
    .digest("base64url");
  return `${payloadSegment}.${signatureSegment}`;
}

export function verifySignedTiktokState(state: string, maxAgeMs = 10 * 60 * 1000) {
  return verifySignedState(state, "TIKTOK_OAUTH_STATE_SECRET", maxAgeMs);
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

function toBase64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createPkceVerifier(length = 64) {
  const raw = crypto.randomBytes(length);
  return toBase64Url(raw);
}

export function createPkceChallenge(verifier: string) {
  return toBase64Url(crypto.createHash("sha256").update(verifier).digest());
}
