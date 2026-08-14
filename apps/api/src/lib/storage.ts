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

  return "png"
}

export async function uploadGeneratedImage(options: {
  organizationId: string
  generationId: string
  imageId: string
  body: Buffer
  contentType: string
}) {
  const extension = extensionFromContentType(options.contentType)
  const filename = `${options.imageId}.${extension}`
  const key = `${options.organizationId}/${options.generationId}/${filename}`

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: options.body,
      ContentType: options.contentType,
      ContentDisposition: `attachment; filename="${filename}"`,
    })
  )

  return `${env.R2_PUBLIC_URL}/${key}`
}
