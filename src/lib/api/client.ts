import { parseErrorResponse } from "./errors";

type QueryPrimitive = string | number | boolean | null | undefined;
type QueryValue = QueryPrimitive | QueryPrimitive[];

export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions<TQuery = unknown>
  extends Omit<RequestInit, "headers"> {
  query?: TQuery;
  headers?: HeadersInit;
  skipJsonParsing?: boolean;
}

function appendParamValue(
  searchParams: URLSearchParams,
  key: string,
  value: QueryPrimitive,
) {
  if (value === null || value === undefined || value === "") {
    return;
  }

  searchParams.append(key, String(value));
}

export function buildQueryString(query?: unknown) {
  if (!query || typeof query !== "object") {
    return "";
  }

  const record = query as Record<string, unknown>;
  const searchParams = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(record)) {
    if (Array.isArray(rawValue)) {
      rawValue.forEach((value) => {
        if (
          value === null ||
          value === undefined ||
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          appendParamValue(searchParams, key, value);
        }
      });
      continue;
    }

    if (
      rawValue === null ||
      rawValue === undefined ||
      typeof rawValue === "string" ||
      typeof rawValue === "number" ||
      typeof rawValue === "boolean"
    ) {
      appendParamValue(searchParams, key, rawValue);
    }
  }

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
}

function normalizeHeaders(headers: HeadersInit | undefined, body: BodyInit | null | undefined) {
  const normalized = new Headers(headers);
  if (!normalized.has("Accept")) {
    normalized.set("Accept", "application/json");
  }

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body && !isFormData && !normalized.has("Content-Type")) {
    normalized.set("Content-Type", "application/json");
  }

  return normalized;
}

export async function request<T, TQuery = unknown>(
  path: string,
  options: RequestOptions<TQuery> = {},
): Promise<T> {
  const { query, headers, skipJsonParsing = false, ...init } = options;
  const finalHeaders = normalizeHeaders(headers, init.body);
  const url = `${path}${buildQueryString(query)}`;

  const response = await fetch(url, {
    ...init,
    headers: finalHeaders,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  if (skipJsonParsing || response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}
