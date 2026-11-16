import {
  generateKeyPairSync, createSign, createVerify
} from "node:crypto";

export const EXPECTED_ISSUER = "https://token.actions.githubusercontent.com";
export const EXPECTED_AUDIENCE = "sts.amazonaws.com";
// This repository was created after GitHub's immutable-identity OIDC rollout.
// The owner/repository IDs are illustrative from the actual GitHub repo metadata;
// inspect live claims before configuring a real AWS role.
export const EXPECTED_SUBJECT =
  "repo:Digberi@23700752/github-actions-control-tower@1460151371:ref:refs/heads/main";

const b64 = input => Buffer.from(JSON.stringify(input)).toString("base64url");

export function makeSyntheticIssuer() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048
  });
  return {
    publicKey,
    signClaims(claims, override = {}) {
      const header = { typ: "JWT", alg: override.algorithm ?? "RS256", kid: "training-key" };
      const unsigned = b64(header) + "." + b64(claims);
      const signature = createSign("RSA-SHA256").update(unsigned).end().sign(privateKey);
      return unsigned + "." + signature.toString("base64url");
    }
  };
}

export function verifyOidcJwt(jwt, publicKey, options = {}) {
  if (typeof jwt !== "string") throw new Error("JWT required");
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("JWT must contain three parts");
  let header;
  let claims;
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid JWT encoding");
  }
  if (header.alg !== "RS256" || header.kid !== "training-key") {
    throw new Error("Unexpected JWT signing algorithm or key id");
  }
  const signed = parts[0] + "." + parts[1];
  const sig = Buffer.from(parts[2], "base64url");
  if (!createVerify("RSA-SHA256").update(signed).end().verify(publicKey, sig)) {
    throw new Error("Invalid JWT signature");
  }
  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (claims.iss !== EXPECTED_ISSUER) throw new Error("OIDC issuer mismatch");
  if (claims.aud !== EXPECTED_AUDIENCE) throw new Error("OIDC audience mismatch");
  if (claims.sub !== EXPECTED_SUBJECT) throw new Error("OIDC subject mismatch");
  if (!Number.isInteger(claims.exp) || claims.exp <= now) throw new Error("OIDC expired");
  if (!Number.isInteger(claims.iat) || claims.iat > now + 30) throw new Error("OIDC future iat");
  if (claims.nbf != null && claims.nbf > now) throw new Error("OIDC not yet valid");
  return {
    allowed: true,
    issuer: claims.iss,
    audience: claims.aud,
    subject: claims.sub,
    expiresInSeconds: claims.exp - now
  };
}

export function syntheticClaims(now = Math.floor(Date.now() / 1000)) {
  return {
    iss: EXPECTED_ISSUER,
    aud: EXPECTED_AUDIENCE,
    sub: EXPECTED_SUBJECT,
    iat: now - 5,
    nbf: now - 5,
    exp: now + 300
  };
}
