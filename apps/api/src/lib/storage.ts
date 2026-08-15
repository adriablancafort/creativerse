import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

import { env } from "@/lib/env"

export const client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

function extensionFromContentType(contentType: string) {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    return "jpg"
  }

  if (contentType.includes("webp")) {
    return "webp"
  }

  if (contentType.includes("mp4")) {
    return "mp4"
  }

  if (contentType.includes("webm")) {
    return "webm"
  }

  if (contentType.includes("quicktime")) {
    return "mov"
  }

  return "png"
}

async function uploadObject(options: {
  key: string
  filename: string
  body: Buffer
  contentType: string
}) {
  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType,
      ContentDisposition: `attachment; filename="${options.filename}"`,
    })
  )

  return `${env.R2_PUBLIC_URL}/${options.key}`
}

export async function uploadCreatedImage(options: {
  organizationId: string
  turnId: string
  imageId: string
  body: Buffer
  contentType: string
}) {
  const extension = extensionFromContentType(options.contentType)
  const filename = `${options.imageId}.${extension}`
  const key = `${options.organizationId}/${options.turnId}/${filename}`

  return uploadObject({
    key,
    filename,
    body: options.body,
    contentType: options.contentType,
  })
}

export async function uploadCreatedVideo(options: {
  organizationId: string
  turnId: string
  body: Buffer
  contentType: string
}) {
  const filename = `${options.turnId}.mp4`
  const key = `${options.organizationId}/${options.turnId}/${filename}`

  return uploadObject({
    key,
    filename,
    body: options.body,
    contentType: options.contentType || "video/mp4",
  })
}

export async function uploadVideoFrame(options: {
  organizationId: string
  assetId: string
  body: Buffer
  contentType: string
}) {
  const extension = extensionFromContentType(options.contentType)
  const filename = `${options.assetId}.${extension}`
  const key = `${options.organizationId}/uploads/${filename}`

  return uploadObject({
    key,
    filename,
    body: options.body,
    contentType: options.contentType,
  })
}

export async function uploadEnhanceSource(options: {
  organizationId: string
  assetId: string
  body: Buffer
  contentType: string
}) {
  const extension = extensionFromContentType(options.contentType)
  const filename = `${options.assetId}.${extension}`
  const key = `${options.organizationId}/uploads/${filename}`

  return uploadObject({
    key,
    filename,
    body: options.body,
    contentType: options.contentType,
  })
}

export async function uploadCreatedEnhance(options: {
  organizationId: string
  turnId: string
  body: Buffer
  contentType: string
  mediaType: "image" | "video"
}) {
  const extension =
    options.mediaType === "video"
      ? "mp4"
      : extensionFromContentType(options.contentType)
  const filename = `${options.turnId}.${extension}`
  const key = `${options.organizationId}/${options.turnId}/${filename}`

  return uploadObject({
    key,
    filename,
    body: options.body,
    contentType:
      options.contentType ||
      (options.mediaType === "video" ? "video/mp4" : "image/png"),
  })
}

export async function uploadEditImageSource(options: {
  organizationId: string
  assetId: string
  body: Buffer
  contentType: string
}) {
  const extension = extensionFromContentType(options.contentType)
  const filename = `${options.assetId}.${extension}`
  const key = `${options.organizationId}/uploads/${filename}`

  return uploadObject({
    key,
    filename,
    body: options.body,
    contentType: options.contentType,
  })
}

export async function uploadEditedImage(options: {
  organizationId: string
  turnId: string
  body: Buffer
  contentType: string
}) {
  const extension = extensionFromContentType(options.contentType)
  const filename = `${options.turnId}.${extension}`
  const key = `${options.organizationId}/${options.turnId}/${filename}`

  return uploadObject({
    key,
    filename,
    body: options.body,
    contentType: options.contentType,
  })
}
