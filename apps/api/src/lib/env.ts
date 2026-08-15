import "dotenv/config"

export const env = {
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:5173",
  API_URL: process.env.API_URL ?? "http://localhost:3000",
  PORT: Number(process.env.PORT ?? "3000"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  REDIS_URL: process.env.REDIS_URL ?? "",
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? "",
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? "",
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? "",
  R2_BUCKET: process.env.R2_BUCKET ?? "",
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL ?? "",
  FAL_KEY: process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? "",
}
