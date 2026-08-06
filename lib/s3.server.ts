// S3 server utilities — server-only, do not import in client components
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface UploadObjectParams {
  key: string;
  body: Uint8Array | Buffer;
  contentType: string;
  cacheControl?: string;
}

let s3ClientInstance: S3Client | null = null;
let s3ClientConfigKey = "";

export function getS3Config(): S3Config {
  const region = process.env.AWS_REGION || process.env.AWS_BUCKET_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;
  const bucket = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;

  const missing: string[] = [];
  if (!region) missing.push("AWS_REGION (or AWS_BUCKET_REGION)");
  if (!accessKeyId) missing.push("AWS_ACCESS_KEY_ID (or AWS_ACCESS_KEY)");
  if (!secretAccessKey) missing.push("AWS_SECRET_ACCESS_KEY (or AWS_SECRET_KEY)");
  if (!bucket) missing.push("AWS_S3_BUCKET (or AWS_BUCKET_NAME)");

  if (missing.length > 0) {
    throw new Error(`Missing required S3 environment variables: ${missing.join(", ")}`);
  }

  return { region: region!, accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, bucket: bucket! };
}

export function getS3Client(): { client: S3Client; bucket: string } {
  const config = getS3Config();
  const currentKey = `${config.region}:${config.accessKeyId}:${config.bucket}`;

  if (!s3ClientInstance || s3ClientConfigKey !== currentKey) {
    s3ClientInstance = new S3Client({
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
    s3ClientConfigKey = currentKey;
  }

  return { client: s3ClientInstance, bucket: config.bucket };
}

export function normalizeStoredObjectKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const trimmed = key.trim();
  return trimmed.length === 0 ? null : trimmed.replace(/^\/+/, "");
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function decodeBase64DataUrl(value: string, maxSizeBytes = 10 * 1024 * 1024) {
  if (!value || typeof value !== "string") throw new Error("Invalid base64 input: expected string");

  let mimeType = "application/octet-stream";
  let base64Data = value.trim();
  const match = base64Data.match(/^data:([^;]+);base64,(.+)$/i);
  if (match) { mimeType = match[1]; base64Data = match[2]; }
  base64Data = base64Data.replace(/\s/g, "");
  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length === 0) throw new Error("Decoded payload is empty");
  if (buffer.length > maxSizeBytes) {
    throw new Error(`File size exceeds maximum allowed limit (${(maxSizeBytes / 1024 / 1024).toFixed(0)} MB)`);
  }

  let extension = "bin";
  if (mimeType.includes("png")) extension = "png";
  else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) extension = "jpg";
  else if (mimeType.includes("pdf")) extension = "pdf";
  else if (mimeType.includes("webp")) extension = "webp";

  return { buffer, mimeType, extension };
}

export async function uploadObject(params: UploadObjectParams): Promise<string> {
  const { client, bucket } = getS3Client();
  const key = normalizeStoredObjectKey(params.key) || params.key;
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: params.body,
    ContentType: params.contentType,
    CacheControl: params.cacheControl || "private, max-age=31536000",
  }));
  return key;
}

export async function deleteObject(key: string | null | undefined): Promise<void> {
  const normalizedKey = normalizeStoredObjectKey(key);
  if (!normalizedKey) return;
  const { client, bucket } = getS3Client();
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: normalizedKey }));
  } catch (err: any) {
    const statusCode = err?.$metadata?.httpStatusCode;
    if (statusCode === 404 || err?.name === "NoSuchKey" || err?.Code === "NoSuchKey") return;
    console.error(`Failed to delete S3 object key "${normalizedKey}":`, err);
  }
}

export async function getPresignedObjectUrl(
  key: string | null | undefined,
  expiresInSeconds = 900,
): Promise<string | null> {
  const normalizedKey = normalizeStoredObjectKey(key);
  if (!normalizedKey) return null;
  const { client, bucket } = getS3Client();
  const ttl = Math.min(Math.max(1, expiresInSeconds), 3600);
  return getSignedUrl(client as any, new GetObjectCommand({ Bucket: bucket, Key: normalizedKey }), { expiresIn: ttl });
}

export function buildSignatureObjectKey(userId: string, extension = "png"): string {
  return `signatures/${userId.replace(/[^a-zA-Z0-9-]/g, "")}/${randomUUID()}.${extension}`;
}

export function buildAttachmentObjectKey(requestId: string, fileName: string): string {
  return `attachments/${requestId.replace(/[^a-zA-Z0-9-]/g, "")}/${randomUUID()}-${sanitizeFileName(fileName)}`;
}

export function buildSignedPdfObjectKey(requestId: string): string {
  return `signed-documents/${requestId.replace(/[^a-zA-Z0-9-]/g, "")}/${randomUUID()}.pdf`;
}
