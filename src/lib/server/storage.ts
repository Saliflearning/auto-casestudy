import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

const isReadOnlyServerless = process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");
const localDataDir = isReadOnlyServerless ? path.join("/tmp", "auto-casestudy") : path.join(process.cwd(), ".data");
const uploadDir = path.join(localDataDir, "uploads");
const referenceScreenshotDir = path.join(localDataDir, "reference-screenshots");

export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageConfigurationError";
  }
}

export type StoredFile = {
  storageUrl: string;
  storageKey: string;
  storageVisibility: "private" | "public-demo" | "local-dev";
};

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function storeArtifactFile(file: File, id: string, bytes: Buffer): Promise<StoredFile> {
  const storageKey = `artifacts/${id}/${safeName(file.name)}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const access = process.env.AUTOCASESTUDY_ALLOW_PUBLIC_ARTIFACT_URLS === "true" ? "public" : "private";

    const blob = await put(storageKey, bytes, {
      access,
      contentType: file.type || "application/octet-stream",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return {
      storageUrl: blob.url,
      storageKey: blob.pathname,
      storageVisibility: access === "public" ? "public-demo" : "private"
    };
  }

  if (isReadOnlyServerless) {
    throw new StorageConfigurationError("Durable artifact storage is not configured for this deployment.");
  }

  await mkdir(uploadDir, { recursive: true });
  const localName = `${id}_${safeName(file.name)}`;
  const absolutePath = path.join(uploadDir, localName);
  const relativePath = `.data/uploads/${localName}`;
  await writeFile(absolutePath, bytes);

  return {
    storageUrl: relativePath,
    storageKey: relativePath,
    storageVisibility: "local-dev"
  };
}

export async function storeReferenceScreenshot(bytes: Buffer, keyParts: { referenceId: string; screenshotId: string }): Promise<StoredFile> {
  const fileName = `${safeName(keyParts.screenshotId)}.png`;
  const storageKey = `reference-screenshots/${safeName(keyParts.referenceId)}/${fileName}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(storageKey, bytes, {
      access: "public",
      contentType: "image/png",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return {
      storageUrl: blob.url,
      storageKey: blob.pathname,
      storageVisibility: "public-demo"
    };
  }

  if (isReadOnlyServerless) {
    throw new StorageConfigurationError("Durable screenshot storage is not configured for this deployment.");
  }

  await mkdir(referenceScreenshotDir, { recursive: true });
  const localName = `${safeName(keyParts.referenceId)}_${fileName}`;
  const absolutePath = path.join(referenceScreenshotDir, localName);
  const relativePath = `.data/reference-screenshots/${localName}`;
  await writeFile(absolutePath, bytes);

  return {
    storageUrl: relativePath,
    storageKey: relativePath,
    storageVisibility: "local-dev"
  };
}
