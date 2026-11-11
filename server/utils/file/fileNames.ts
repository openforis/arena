// characters not allowed in file names on the common file systems (path separators included)
const charsNotAllowedRegex = /[<>:"/\\|?*]/g

/**
 * Returns a name that can be used for a file inside a folder: characters not allowed in file names (path separators
 * included) and control characters are replaced with "_", leading dots (e.g. "..") are removed.
 * @param fileName - The file name (e.g. the name of an uploaded file).
 * @returns The safe file name (empty if nothing is left).
 */
export const toSafeFileName = (fileName: string | null | undefined): string =>
  Array.from(String(fileName ?? ''))
    .map((char) => ((char.codePointAt(0) ?? 0) < 32 ? '_' : char))
    .join('')
    .replaceAll(charsNotAllowedRegex, '_')
    .trim()
    .replace(/^\.+/, '')
