import { randomUUID } from "crypto";
import { MagsterStorage } from "@/lib/magster/tables";
import { getMagsterSupabase } from "@/lib/supabase/server";
import { MAX_RECEIPT_BYTES } from "@/lib/constants/auth";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
};

export async function uploadPaymentReceipt(input: {
  studentId: number;
  bytes: Buffer;
  contentType: string;
}): Promise<string> {
  const extension = ALLOWED_TYPES[input.contentType];
  if (!extension) {
    throw new Error("Please select a JPG, JPEG, or PNG image.");
  }
  if (input.bytes.byteLength > MAX_RECEIPT_BYTES) {
    throw new Error("The selected image exceeds the maximum size of 3 MB.");
  }

  const path = `student-${input.studentId}/${randomUUID()}.${extension}`;
  const client = getMagsterSupabase();
  const { error } = await client.storage
    .from(MagsterStorage.paymentReceipts)
    .upload(path, input.bytes, {
      contentType: input.contentType === "image/jpg" ? "image/jpeg" : input.contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Could not upload receipt image.");
  }

  const { data } = client.storage.from(MagsterStorage.paymentReceipts).getPublicUrl(path);
  return data.publicUrl;
}
