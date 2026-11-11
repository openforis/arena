const decodeOrNull = (value: string): string | null => {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

/**
 * Extracts the file name from a Content-Disposition header (the RFC 5987 filename* parameter is preferred).
 * @param contentDisposition - The header value.
 * @returns The file name, or null if not specified.
 */
export const getFileNameFromContentDisposition = (contentDisposition: string | undefined | null): string | null => {
  if (!contentDisposition) return null
  const encodedMatch = /filename\*=(?:[\w-]*'[^']*')?([^;]+)/i.exec(contentDisposition)
  const decodedFileName = encodedMatch ? decodeOrNull(encodedMatch[1].trim()) : null
  if (decodedFileName) return decodedFileName

  const match = /filename=(?:"([^"]*)"|([^;]+))/i.exec(contentDisposition)
  return (match?.[1] ?? match?.[2])?.trim() || null
}
