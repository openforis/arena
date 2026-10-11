export type FetchLike = typeof fetch

// A month already folded into items.parquet answers 404; S3-style hosts answer 403 for missing keys.
export const ABSENT_PART_STATUSES = new Set([403, 404])
// Index files are rewritten when scenes are folded: never pair an HTTP-cached range with a fresh footer.
// Footers and row groups are cached in memory for the session instead.
export const SCENE_INDEX_REQUEST_INIT: RequestInit = { cache: 'no-store' }

type ReadPartLengthParams = { url: string; fetchImpl: FetchLike; signal?: AbortSignal }

/**
 * Reads the size of an index part with a HEAD request.
 *
 * @param {ReadPartLengthParams} params - Part URL, fetch function and optional abort signal.
 * @returns {Promise<number|null>} Size in bytes, or null when the part does not exist (404/403).
 */
export const readPartLength = async ({ url, fetchImpl, signal }: ReadPartLengthParams): Promise<number | null> => {
  const response = await fetchImpl(url, { ...SCENE_INDEX_REQUEST_INIT, method: 'HEAD', signal })
  if (ABSENT_PART_STATUSES.has(response.status)) return null
  if (!response.ok) throw new Error(`Reading ${url} failed with status ${response.status}.`)
  const byteLength = Number(response.headers.get('content-length'))
  if (!Number.isFinite(byteLength) || byteLength <= 0) throw new Error(`${url} has no content length.`)
  return byteLength
}
