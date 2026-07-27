import { useEffect, useState } from 'react'

import * as SurveyBranding from '@core/survey/surveyBranding'

import * as API from '@webapp/service/api'

const MIME_BY_EXTENSION = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
}

/**
 * Infers an image MIME type from a Content-Disposition filename.
 * @param {string|undefined|null} contentDisposition
 * @returns {string|null}
 */
const mimeTypeFromContentDisposition = (contentDisposition) => {
  if (!contentDisposition) return null
  const fileNameMatch = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(contentDisposition)
  const fileName = fileNameMatch?.[1] ? decodeURIComponent(fileNameMatch[1].replaceAll('"', '')) : null
  if (!fileName) return null
  const extension = fileName.split('.').pop()?.toLowerCase()
  return MIME_BY_EXTENSION[extension] || null
}

/**
 * Ensures the blob has a usable image MIME type (survey file API often omits Content-Type).
 * @param {import('axios').AxiosResponse} response
 * @returns {Blob}
 */
const toDisplayableImageBlob = (response) => {
  const blob = response.data
  if (blob?.type && blob.type !== 'application/octet-stream') {
    return blob
  }
  const headerType = response.headers?.['content-type']
  const mimeType =
    (headerType && headerType !== 'application/octet-stream' ? headerType : null) ||
    mimeTypeFromContentDisposition(response.headers?.['content-disposition']) ||
    'application/octet-stream'
  return new Blob([blob], { type: mimeType })
}

/**
 * Resolves a displayable image src for a branding logo.
 * External HTTPS URLs are used directly; survey file UUIDs are fetched as blobs
 * because the file API serves Content-Disposition: attachment (not usable as img src).
 *
 * @param {{surveyId: number|string|null, logo: {fileUuid?: string, url?: string}|null|undefined, localObjectUrl?: string|null}} params
 * @returns {string|null}
 */
export const useBrandingLogoSrc = ({ surveyId, logo, localObjectUrl = null }) => {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    let cancelled = false
    let blobUrlToRevoke = null

    const resolve = async () => {
      if (localObjectUrl) {
        setSrc(localObjectUrl)
        return
      }

      const externalUrl = logo?.[SurveyBranding.keys.url]
      if (SurveyBranding.isValidLogoUrl(externalUrl)) {
        setSrc(externalUrl)
        return
      }

      const fileUuid = logo?.[SurveyBranding.keys.fileUuid]
      if (!fileUuid || !surveyId) {
        setSrc(null)
        return
      }

      try {
        const response = await API.fetchSurveyFile({ surveyId, fileUuid })
        if (cancelled) return
        blobUrlToRevoke = URL.createObjectURL(toDisplayableImageBlob(response))
        setSrc(blobUrlToRevoke)
      } catch {
        if (!cancelled) setSrc(null)
      }
    }

    resolve()

    return () => {
      cancelled = true
      if (blobUrlToRevoke) {
        URL.revokeObjectURL(blobUrlToRevoke)
      }
    }
  }, [localObjectUrl, logo?.[SurveyBranding.keys.fileUuid], logo?.[SurveyBranding.keys.url], surveyId])

  return src
}
