export const DEFAULT_MAX_FILE_SIZE_MB = 10 // same default as NodeDef.getMaxFileSize

const BYTES_PER_MB = 1024 * 1024

export type ScreenshotSizeCheck =
  { ok: true } | { ok: false; reason: 'maxFileSize'; sizeMb: number; limitMb: number } | { ok: false; reason: 'quota' }

/**
 * Returns the max file size to apply: the attribute's own, or the default when it is missing or not valid.
 * @param {number|null} [maxFileSizeMb] - Max file size of the attribute, in MB.
 * @returns {number} The max file size in MB.
 */
export const getEffectiveMaxFileSizeMb = (maxFileSizeMb?: number | null): number =>
  typeof maxFileSizeMb === 'number' && Number.isFinite(maxFileSizeMb) && maxFileSizeMb > 0
    ? maxFileSizeMb
    : DEFAULT_MAX_FILE_SIZE_MB

/**
 * Checks a screenshot against the attribute's max file size and the free file space of the survey.
 * @param {object} params - The parameters.
 * @param {number} params.sizeBytes - Size of the PNG, in bytes.
 * @param {number|null} [params.maxFileSizeMb] - Max file size of the attribute, in MB.
 * @param {number|null} [params.availableSpaceBytes] - Free file space of the survey, in bytes (null: unknown).
 * @returns {ScreenshotSizeCheck} The result; when not ok, the reason and the sizes for the message.
 */
export const checkScreenshotSize = ({
  sizeBytes,
  maxFileSizeMb = null,
  availableSpaceBytes = null,
}: {
  sizeBytes: number
  maxFileSizeMb?: number | null
  availableSpaceBytes?: number | null
}): ScreenshotSizeCheck => {
  const limitMb = getEffectiveMaxFileSizeMb(maxFileSizeMb)
  if (sizeBytes > limitMb * BYTES_PER_MB) {
    return { ok: false, reason: 'maxFileSize', sizeMb: Number((sizeBytes / BYTES_PER_MB).toFixed(1)), limitMb }
  }
  if (
    typeof availableSpaceBytes === 'number' &&
    Number.isFinite(availableSpaceBytes) &&
    sizeBytes > availableSpaceBytes
  ) {
    return { ok: false, reason: 'quota' }
  }
  return { ok: true }
}

/**
 * Reads the free file space from the survey files statistics (Survey.getFilesStatistics).
 * @param {object|null} [statistics] - The files statistics ({} when missing).
 * @returns {number|null} The free space in bytes, or null when unknown.
 */
export const getAvailableSpaceBytes = (statistics?: { availableSpace?: number } | null): number | null => {
  const availableSpace = statistics?.availableSpace
  return typeof availableSpace === 'number' && Number.isFinite(availableSpace) ? availableSpace : null
}
