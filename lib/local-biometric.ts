const BIOMETRIC_CREDENTIAL_ID_KEY = "milele-biometric-credential-id";

function toBase64Url(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

export async function isBiometricSupported() {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

export function hasBiometricCredential() {
  return !!localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
}

export async function registerBiometricCredential() {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        name: "Milele",
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: "milele-local-user",
        displayName: "Milele User",
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      timeout: 60000,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      attestation: "none",
    },
  });

  if (!credential || !(credential instanceof PublicKeyCredential)) {
    throw new Error("Creation biometrique annulee");
  }

  const id = toBase64Url(new Uint8Array(credential.rawId));
  localStorage.setItem(BIOMETRIC_CREDENTIAL_ID_KEY, id);
}

export async function verifyBiometricPresence() {
  const id = localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
  if (!id) {
    throw new Error("Biometrie non configuree");
  }

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      timeout: 60000,
      userVerification: "required",
      allowCredentials: [{
        id: fromBase64Url(id),
        type: "public-key",
      }],
    },
  });

  if (!assertion) {
    throw new Error("Verification biometrique annulee");
  }
}

export function clearBiometricCredential() {
  localStorage.removeItem(BIOMETRIC_CREDENTIAL_ID_KEY);
}
