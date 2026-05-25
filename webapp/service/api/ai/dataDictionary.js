/**
 * Frontend client for the data-dictionary feature (Tier 1 #7). Triggers a
 * direct file download (HTML or Markdown) without needing a download
 * token, since the response is small enough to stream straight back.
 */
import axios from 'axios'

/**
 * Generates and downloads the survey's data dictionary in the requested
 * format.
 * @param {object} args - Args.
 * @param {number} args.surveyId - Survey ID.
 * @param {string} args.format - "html" or "md".
 * @param {string} [args.lang] - Optional language code.
 * @param {boolean} [args.fillMissingDescriptions] - When true, AI fills empty descriptions.
 * @returns {Promise<{filename: string, aiCount: number, totalEntries: number}>}
 *   Metadata about the download.
 */
export const generateAndDownload = async ({ surveyId, format, lang, fillMissingDescriptions = true }) => {
  const response = await axios.post(
    `/api/ai/survey/${surveyId}/dataDictionary/generate`,
    { format, lang, fillMissingDescriptions },
    { responseType: 'blob' }
  )

  // Pull filename from Content-Disposition; fall back to a sensible default.
  const disposition = response.headers['content-disposition'] || ''
  const match = /filename="?([^"]+)"?/i.exec(disposition)
  const filename = match?.[1] || `data_dictionary.${format === 'md' ? 'md' : 'html'}`

  // Trigger the download via a temporary anchor.
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)

  return {
    filename,
    aiCount: Number(response.headers['x-ai-count'] || 0),
    totalEntries: Number(response.headers['x-total-entries'] || 0),
  }
}
