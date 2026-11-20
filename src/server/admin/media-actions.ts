"use server";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { IMAGE_MAX_MB, IMAGE_TYPES, MEDIA_FOLDERS } from "@/lib/media";
import { requireRole } from "@/server/auth/guard";
import { createSignedUploadUrl } from "@/server/storage";

const EXTENSION: Record<(typeof IMAGE_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const schema = z.object({
  folder: z.enum(MEDIA_FOLDERS),
  type: z.enum(IMAGE_TYPES, { error: "Dozvoljeni su samo JPG, PNG i WebP." }),
  size: z
    .number()
    .int()
    .positive()
    .max(IMAGE_MAX_MB * 1024 * 1024, { error: `Fotografija može imati najviše ${IMAGE_MAX_MB} MB.` }),
});

/**
 * Potpisan link za jednu fotografiju (sobe, kampanje, početna). Browser šalje fajl pravo u Storage;
 * u bazu se upisuje tek posebnom akcijom tog mesta (npr. setRoomImage), koja proverava putanju.
 */
export async function createMediaUpload(input: {
  folder: string;
  type: string;
  size: number;
}): Promise<{ ok: true; path: string; uploadUrl: string } | { ok: false; error: string }> {
  await requireRole("ADMIN");

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Neispravan fajl." };

  const path = `${parsed.data.folder}/${randomUUID()}.${EXTENSION[parsed.data.type]}`;
  try {
    return { ok: true, path, uploadUrl: await createSignedUploadUrl(path) };
  } catch {
    return { ok: false, error: "Upload trenutno nije moguć. Proverite podešavanja Storage-a." };
  }
}