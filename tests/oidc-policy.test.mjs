import { test } from "node:test";
import assert from "node:assert/strict";
import { makeSyntheticIssuer, syntheticClaims, verifyOidcJwt } from "../scripts/oidc-policy.mjs";

test("G27 accepts locally signed and policy-matching OIDC example", () => {
  const signer = makeSyntheticIssuer();
  const now = Math.floor(Date.now() / 1000);
  assert.equal(verifyOidcJwt(signer.signClaims(syntheticClaims(now)), signer.publicKey, { now }).allowed, true);
});

for (const [label, mutation, error] of [
  ["subject", claims => { claims.sub = "repo:attacker/fork:ref:refs/heads/main"; }, /subject mismatch/],
  ["audience", claims => { claims.aud = "evil.invalid"; }, /audience mismatch/],
  ["issuer", claims => { claims.iss = "https://evil.invalid"; }, /issuer mismatch/],
  ["expiry", (claims, now) => { claims.exp = now - 1; }, /expired/],
  ["not-before", (claims, now) => { claims.nbf = now + 100; }, /not yet valid/],
  ["iat", (claims, now) => { claims.iat = now + 100; }, /future iat/]
]) {
  test("G27 rejects wrong " + label, () => {
    const signer = makeSyntheticIssuer();
    const now = Math.floor(Date.now() / 1000);
    const claims = syntheticClaims(now);
    mutation(claims, now);
    assert.throws(
      () => verifyOidcJwt(signer.signClaims(claims), signer.publicKey, { now }),
      error
    );
  });
}

test("G27 rejects unknown key and alg=none with a syntactically valid signature", () => {
  const signer = makeSyntheticIssuer();
  const now = Math.floor(Date.now() / 1000);
  const jwt = signer.signClaims(syntheticClaims(now));
  assert.throws(
    () => verifyOidcJwt(jwt, makeSyntheticIssuer().publicKey, { now }),
    /signature/
  );
  assert.throws(
    () => verifyOidcJwt(signer.signClaims(syntheticClaims(now), { algorithm: "none" }),
      signer.publicKey, { now }),
    /algorithm/
  );
});
