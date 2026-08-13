import "dotenv/config"

export const env = {
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:5173",
  API_URL: process.env.API_URL ?? "http://localhost:3000",
  PORT: Number(process.env.PORT ?? "3000"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
}
