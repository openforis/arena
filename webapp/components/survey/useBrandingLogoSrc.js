import { useEffect, useState } from 'react'

import * as SurveyBranding from '@core/survey/surveyBranding'

import * as API from '@webapp/service/api'

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
        blobUrlToRevoke = URL.createObjectURL(response.data)
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
