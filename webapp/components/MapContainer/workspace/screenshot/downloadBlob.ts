const REVOKE_DELAY_MS = 1000

/**
 * Downloads a blob as a file through a temporary link.
 * @param {Blob} blob - The content.
 * @param {string} fileName - The file name.
 * @returns {void}
 */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // the browser reads the URL asynchronously: revoke it a bit later
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}
