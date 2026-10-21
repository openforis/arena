import { Versions } from '@openforis/arena-core'

/** Request header carrying the Arena Mobile app version. */
export const mobileAppVersionHeader = 'X-Arena-Mobile-App-Version'

/** Minimum Arena Mobile app version allowed to download records from the server. */
export const minMobileAppVersionRecordsDownload = '0.0.0'

/** Minimum Arena Mobile app version whose records can be uploaded (imported) into the server. */
export const minMobileAppVersionRecordsUpload = '0.0.0'

// version of apps released before the compatibility check (no version sent) or sending an invalid one
const unknownMobileAppVersion = '0.0.0'

const parseableVersionOrUnknown = (appVersion?: string | null): string => {
  if (!appVersion) return unknownMobileAppVersion
  try {
    Versions.parse(appVersion)
    return appVersion
  } catch {
    return unknownMobileAppVersion
  }
}

/**
 * Whether the given Arena Mobile app version is lower than the given minimum one.
 * @param {object} params - The parameters.
 * @param {string|null|undefined} params.appVersion - The app version (unknown when not specified).
 * @param {string} params.minVersion - The minimum version.
 * @returns {boolean} - True if the app version is not supported.
 */
export const isMobileAppVersionNotSupported = ({
  appVersion,
  minVersion,
}: {
  appVersion?: string | null
  minVersion: string
}): boolean => Versions.isLessThan(parseableVersionOrUnknown(appVersion), minVersion)
