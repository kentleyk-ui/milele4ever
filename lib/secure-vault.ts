export type VaultItemType = "note" | "credential" | "document";

export interface VaultItem {
  id: string;
  type: VaultItemType;
  title: string;
  secret: string;
  createdAt: string;
  updatedAt: string;
}

interface VaultPayload {
  version: 1;
  items: VaultItem[];
}

interface VaultEnvelope {
  version: 1;
  salt: string;
  iv: string;
  cipher: string;
}

const VAULT_STORAGE_KEY = "milele-secure-vault";
const PBKDF2_ITERATIONS = 120000;

function toBase64(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

function fromBase64(value: string) {
  const bin = atob(value);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function utf8ToBytes(value: string) {
  return new TextEncoder().encode(value);
}

function bytesToUtf8(value: Uint8Array) {
  return new TextDecoder().decode(value);
}

async function deriveAesKey(passphrase: string, salt: Uint8Array) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    utf8ToBytes(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptVault(payload: VaultPayload, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    utf8ToBytes(JSON.stringify(payload))
  );

  const cipherBytes = new Uint8Array(cipherBuffer);

  const envelope: VaultEnvelope = {
    version: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    cipher: toBase64(cipherBytes),
  };

  return JSON.stringify(envelope);
}

export async function decryptVault(rawEnvelope: string, passphrase: string) {
  const envelope = JSON.parse(rawEnvelope) as VaultEnvelope;
  if (!envelope || envelope.version !== 1) {
    throw new Error("Format de coffre invalide");
  }

  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const cipher = fromBase64(envelope.cipher);
  const key = await deriveAesKey(passphrase, salt);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipher
  );

  const decoded = bytesToUtf8(new Uint8Array(plainBuffer));
  const payload = JSON.parse(decoded) as VaultPayload;

  if (!payload || payload.version !== 1 || !Array.isArray(payload.items)) {
    throw new Error("Contenu du coffre invalide");
  }

  return payload;
}

export function loadVaultEnvelope() {
  return localStorage.getItem(VAULT_STORAGE_KEY);
}

export function clearVaultEnvelope() {
  localStorage.removeItem(VAULT_STORAGE_KEY);
}

export async function saveVaultItems(items: VaultItem[], passphrase: string) {
  const payload: VaultPayload = {
    version: 1,
    items,
  };

  const encrypted = await encryptVault(payload, passphrase);
  localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
}

export async function openVault(passphrase: string) {
  const raw = loadVaultEnvelope();
  if (!raw) {
    return { exists: false as const, items: [] as VaultItem[] };
  }

  const payload = await decryptVault(raw, passphrase);
  return { exists: true as const, items: payload.items };
}
