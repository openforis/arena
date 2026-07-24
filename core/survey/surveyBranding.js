import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  branding: 'branding',
  primaryColor: 'primaryColor',
  surveyLogo: 'surveyLogo',
  countryLogo: 'countryLogo',
  fileUuid: 'fileUuid',
  url: 'url',
}

const HEX_COLOR_REGEXP = /^#[0-9A-Fa-f]{6}$/

/**
 * Returns whether value is a valid #RRGGBB primary color.
 * @param {unknown} value
 * @returns {boolean}
 */
export const isValidPrimaryColor = (value) => typeof value === 'string' && HEX_COLOR_REGEXP.test(value)

/**
 * Returns whether value is an https logo URL.
 * @param {unknown} value
 * @returns {boolean}
 */
export const isValidLogoUrl = (value) => {
  if (typeof value !== 'string' || value.length === 0) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Returns branding object from survey info props.
 * @param {object} surveyInfo
 * @returns {object}
 */
export const getBranding = (surveyInfo) => ObjectUtils.getProp(keys.branding, {})(surveyInfo) || {}

/**
 * Returns validated primary color or null.
 * @param {object} surveyInfo
 * @returns {string|null}
 */
export const getPrimaryColor = (surveyInfo) => {
  const color = getBranding(surveyInfo)[keys.primaryColor]
  return isValidPrimaryColor(color) ? color : null
}

export const getSurveyLogo = (surveyInfo) => getBranding(surveyInfo)[keys.surveyLogo] || null
export const getCountryLogo = (surveyInfo) => getBranding(surveyInfo)[keys.countryLogo] || null

/**
 * Resolves display src for a logo descriptor.
 * @param {{fileUuid?: string, url?: string}|null|undefined} logo
 * @param {{surveyId: number|string, getFileDownloadUrl: Function}} params
 * @returns {string|null}
 */
export const resolveLogoSrc = (logo, { surveyId, getFileDownloadUrl }) => {
  if (!logo || typeof logo !== 'object') return null
  const fileUuid = logo[keys.fileUuid]
  if (typeof fileUuid === 'string' && fileUuid.length > 0) {
    return getFileDownloadUrl({ surveyId, fileUuid })
  }
  const url = logo[keys.url]
  return isValidLogoUrl(url) ? url : null
}

/**
 * Returns file UUIDs referenced by branding logos.
 * @param {object} branding
 * @returns {string[]}
 */
export const getBrandingFileUuids = (branding = {}) => {
  const uuids = []
  for (const logoKey of [keys.surveyLogo, keys.countryLogo]) {
    const fileUuid = branding?.[logoKey]?.[keys.fileUuid]
    if (typeof fileUuid === 'string' && fileUuid.length > 0) uuids.push(fileUuid)
  }
  return uuids
}
