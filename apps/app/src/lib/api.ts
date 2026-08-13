import { env } from "@/lib/env"

type RequestOptions = {
  headers?: HeadersInit
  body?: unknown
}

async function request<T>(
  method: string,
  path: string,
  options?: RequestOptions
): Promise<T> {
  const headers = new Headers(options?.headers)
  if (options?.body) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${env.API_URL}${path}`, {
    ...options,
    credentials: "include",
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error || body.message || response.status)
  }

  return body as T
}

export const api = {
  get<T>(path: string, options?: RequestOptions) {
    return request<T>("GET", path, options)
  },
  post<T>(path: string, options?: RequestOptions) {
    return request<T>("POST", path, options)
  },
  put<T>(path: string, options?: RequestOptions) {
    return request<T>("PUT", path, options)
  },
  patch<T>(path: string, options?: RequestOptions) {
    return request<T>("PATCH", path, options)
  },
  delete<T>(path: string, options?: RequestOptions) {
    return request<T>("DELETE", path, options)
  },
}
