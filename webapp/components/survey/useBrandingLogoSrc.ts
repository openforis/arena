import { useEffect, useState } from 'react'
import type { AxiosResponse } from 'axios'

import * as SurveyBranding from '@core/survey/surveyBranding'
import type { BrandingImageDescriptor } from '@core/survey/surveyBranding'

import * as API from '@webapp/service/api'
import { getFileNameFromContentDisposition } from '@webapp/utils/contentDispositionUtils'

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
  const fileName = getFileNameFromContentDisposition(contentDisposition)
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
  const headerTypeString = typeof headerType === 'string' ? headerType : null
  const mimeType =
    (headerTypeString && headerTypeString !== 'application/octet-stream' ? headerTypeString : null) ||
    mimeTypeFromContentDisposition(response.headers?.['content-disposition']) ||
    'application/octet-stream'
  return new Blob([blob], { type: mimeType })
}

type UseBrandingLogoSrcParams = {
  surveyId: number | string | null
  logo: BrandingImageDescriptor | null | undefined
  localObjectUrl?: string | null
}

type BrandingLogoState = {
  src: string | null
  /** True when the referenced file could not be loaded (e.g. missing from the storage). */
  loadError: boolean
}

const emptyState: BrandingLogoState = { src: null, loadError: false }

/**
 * Resolves a displayable image src for a branding logo, reporting load failures.
 * Survey file UUIDs are fetched as blobs because the file API serves Content-Disposition: attachment
 * (not usable as img src).
 */
export const useBrandingLogo = ({
  surveyId,
  logo,
  localObjectUrl = null,
}: UseBrandingLogoSrcParams): BrandingLogoState => {
  const [state, setState] = useState<BrandingLogoState>(emptyState)

  useEffect(() => {
    let cancelled = false
    let blobUrlToRevoke: string | null = null

    const resolve = async () => {
      if (localObjectUrl) {
        setState({ src: localObjectUrl, loadError: false })
        return
      }

      const fileUuid = logo?.[SurveyBranding.keys.fileUuid]
      if (!fileUuid || !surveyId) {
        setState(emptyState)
        return
      }

      try {
        const response = await API.fetchSurveyFile({ surveyId, fileUuid, errorHandledLocally: true })
        if (cancelled) return
        blobUrlToRevoke = URL.createObjectURL(toDisplayableImageBlob(response))
        setState({ src: blobUrlToRevoke, loadError: false })
      } catch {
        if (!cancelled) setState({ src: null, loadError: true })
      }
    }

    void resolve()

    return () => {
      cancelled = true
      if (blobUrlToRevoke) {
        URL.revokeObjectURL(blobUrlToRevoke)
      }
    }
  }, [localObjectUrl, logo?.[SurveyBranding.keys.fileUuid], surveyId])

  return state
}

/**
 * Resolves a displayable image src for a branding logo (null when missing or not loadable).
 */
export const useBrandingLogoSrc = (params: UseBrandingLogoSrcParams): string | null => useBrandingLogo(params).src
