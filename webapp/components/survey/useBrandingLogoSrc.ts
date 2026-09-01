import { useEffect, useState } from 'react'
import type { AxiosResponse } from 'axios'

import * as SurveyBranding from '@core/survey/surveyBranding'
import type { BrandingImageDescriptor } from '@core/survey/surveyBranding'

import * as API from '@webapp/service/api'

const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
}

/**
 * Infers an image MIME type from a Content-Disposition filename.
 */
const mimeTypeFromContentDisposition = (contentDisposition: string | undefined | null): string | null => {
  if (!contentDisposition) return null
  const fileNameMatch = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(contentDisposition)
  const fileName = fileNameMatch?.[1] ? decodeURIComponent(fileNameMatch[1].replaceAll('"', '')) : null
  if (!fileName) return null
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? MIME_BY_EXTENSION[extension] || null : null
}

/**
 * Ensures the blob has a usable image MIME type (survey file API often omits Content-Type).
 */
const toDisplayableImageBlob = (response: AxiosResponse<Blob>): Blob => {
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

type UseBrandingLogoSrcParams = {
  surveyId: number | string | null
  logo: BrandingImageDescriptor | null | undefined
  localObjectUrl?: string | null
}

/**
 * Resolves a displayable image src for a branding logo.
 * Survey file UUIDs are fetched as blobs because the file API serves Content-Disposition: attachment
 * (not usable as img src).
 */
export const useBrandingLogoSrc = ({
  surveyId,
  logo,
  localObjectUrl = null,
}: UseBrandingLogoSrcParams): string | null => {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let blobUrlToRevoke: string | null = null

    const resolve = async () => {
      if (localObjectUrl) {
        setSrc(localObjectUrl)
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
  }, [localObjectUrl, logo?.[SurveyBranding.keys.fileUuid], surveyId])

  return src
}
