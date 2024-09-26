const getExtension = (file) => {
  const fileName = typeof file === 'string' ? file : file.name
  const extension = fileName.split('.').pop()
  return extension
}

/**
 * Format bytes as human-readable text.
 *
 * @param {!number} bytes - Number of bytes.
 * @param {object} options - Options object.
 * @param {boolean} [options.si] - True to use metric (SI) units, aka powers of 1000. False to use binary (IEC), aka powers of 1024.
 * @param {number} [options.decimalPlaces] - Number of decimal places to display.
 *
 * @returns {string} - Formatted string.
 */
const toHumanReadableFileSize = (bytes, { si = true, decimalPlaces = 1 } = {}) => {
  const threshold = si ? 1000 : 1024

  if (Math.abs(bytes) < threshold) {
    return bytes + ' B'
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  let unitIndex = -1
  const ratio = 10 ** decimalPlaces

  do {
    bytes /= threshold
    ++unitIndex
  } while (Math.round(Math.abs(bytes) * ratio) / ratio >= threshold && unitIndex < units.length - 1)

  return bytes.toFixed(decimalPlaces) + ' ' + units[unitIndex]
}

const acceptByExtension = {
  csv: { 'text/csv': ['.csv'] },
  zip: { 'application/zip': ['.zip'] },
}

const readAsText = async (file, ignoreErrors = true) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      resolve(text)
    }
    reader.onerror = (error) => {
      if (ignoreErrors) {
        resolve(null)
      } else {
        reject(error)
      }
    }
    reader.readAsText(file)
  })

export const FileUtils = {
  getExtension,
  toHumanReadableFileSize,
  acceptByExtension,
  readAsText,
}
