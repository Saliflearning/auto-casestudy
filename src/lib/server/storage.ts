import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

const uploadDir = path.join(process.cwd(), ".data", "uploads");

export type StoredFile = {
  storageUrl: string;
  storageKey: string;
};

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function storeArtifactFile(file: File, id: string, bytes: Buffer): Promise<StoredFile> {
  const storageKey = `artifacts/${id}/${safeName(file.name)}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(storageKey, bytes, {
      access: "public",
      contentType: file.type || "application/octet-stream",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return {
      storageUrl: blob.url,
      storageKey: blob.pathname
    };
  }

  await mkdir(uploadDir, { recursive: true });
  const localName = `${id}_${safeName(file.name)}`;
  const absolutePath = path.join(uploadDir, localName);
  const relativePath = `.data/uploads/${localName}`;
  await writeFile(absolutePath, bytes);

  return {
    storageUrl: relativePath,
    storageKey: relativePath
  };
}
