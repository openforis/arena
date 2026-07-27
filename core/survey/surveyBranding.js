import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  branding: 'branding',
  primaryColor: 'primaryColor',
  surveyLogo1: 'surveyLogo1',
  surveyLogo2: 'surveyLogo2',
  surveyLogo3: 'surveyLogo3',
  landingBackground: 'landingBackground',
  titleFontSize: 'titleFontSize',
  descriptionFontSize: 'descriptionFontSize',
  fileUuid: 'fileUuid',
  url: 'url',
}

/** Ordered survey logo prop keys for branding and landing display. */
export const surveyLogoKeys = [keys.surveyLogo1, keys.surveyLogo2, keys.surveyLogo3]

export const fontSizePreset = {
  small: 'small',
  default: 'default',
  large: 'large',
}

/** @type {readonly string[]} */
export const fontSizePresetValues = Object.freeze(Object.values(fontSizePreset))

/** Maximum landing background upload size in bytes (5 MiB). */
export const LANDING_BACKGROUND_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

const HEX_COLOR_REGEXP = /^#[0-9A-Fa-f]{6}$/

const titleFontSizeRemByPreset = {
  [fontSizePreset.small]: '1.5rem',
  [fontSizePreset.default]: '2rem',
  [fontSizePreset.large]: '2.5rem',
}

const descriptionFontSizeRemByPreset = {
  [fontSizePreset.small]: '1rem',
  [fontSizePreset.default]: '1.125rem',
  [fontSizePreset.large]: '1.25rem',
}

const imageDescriptorKeys = [...surveyLogoKeys, keys.landingBackground]

/**
 * Returns whether value is a valid font size preset.
 * @param {unknown} value
 * @returns {boolean}
 */
export const isValidFontSizePreset = (value) =>
  typeof value === 'string' && fontSizePresetValues.includes(value)

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
 * Returns whether branding props are valid for save.
 * Empty optional fields are allowed.
 * @param {object} branding
 * @returns {boolean}
 */
export const isBrandingValid = (branding = {}) => {
  const primaryColor = branding[keys.primaryColor]
  if (primaryColor && !isValidPrimaryColor(primaryColor)) return false

  const titleFontSize = branding[keys.titleFontSize]
  if (titleFontSize && !isValidFontSizePreset(titleFontSize)) return false

  const descriptionFontSize = branding[keys.descriptionFontSize]
  if (descriptionFontSize && !isValidFontSizePreset(descriptionFontSize)) return false

  for (const imageKey of imageDescriptorKeys) {
    const url = branding[imageKey]?.[keys.url]
    if (url && !isValidLogoUrl(url)) return false
  }

  return true
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

/**
 * Returns title font size preset or default.
 * @param {object} surveyInfo
 * @returns {string}
 */
export const getTitleFontSizePreset = (surveyInfo) => {
  const preset = getBranding(surveyInfo)[keys.titleFontSize]
  return isValidFontSizePreset(preset) ? preset : fontSizePreset.default
}

/**
 * Returns description font size preset or default.
 * @param {object} surveyInfo
 * @returns {string}
 */
export const getDescriptionFontSizePreset = (surveyInfo) => {
  const preset = getBranding(surveyInfo)[keys.descriptionFontSize]
  return isValidFontSizePreset(preset) ? preset : fontSizePreset.default
}

/**
 * Returns CSS font-size for the landing title.
 * @param {object} surveyInfo
 * @returns {string}
 */
export const getTitleFontSizeRem = (surveyInfo) => titleFontSizeRemByPreset[getTitleFontSizePreset(surveyInfo)]

/**
 * Returns CSS font-size for the landing description.
 * @param {object} surveyInfo
 * @returns {string}
 */
export const getDescriptionFontSizeRem = (surveyInfo) =>
  descriptionFontSizeRemByPreset[getDescriptionFontSizePreset(surveyInfo)]

/**
 * Returns a survey logo descriptor by slot index (1-based).
 * @param {object} surveyInfo
 * @param {1|2|3} slot
 * @returns {{fileUuid?: string, url?: string}|null}
 */
export const getSurveyLogoBySlot = (surveyInfo, slot) => {
  const logoKey = surveyLogoKeys[slot - 1]
  return logoKey ? getBranding(surveyInfo)[logoKey] || null : null
}

/**
 * Returns survey logo descriptors in display order (slots 1–3).
 * @param {object} surveyInfo
 * @returns {Array<{fileUuid?: string, url?: string}|null>}
 */
export const getSurveyLogos = (surveyInfo) => surveyLogoKeys.map((logoKey) => getBranding(surveyInfo)[logoKey] || null)

export const getLandingBackground = (surveyInfo) => getBranding(surveyInfo)[keys.landingBackground] || null

/**
 * Returns whether a logo descriptor has a file UUID or valid https URL.
 * @param {{fileUuid?: string, url?: string}|null|undefined} logo
 * @returns {boolean}
 */
export const hasLogoDescriptor = (logo) => {
  if (!logo || typeof logo !== 'object') return false
  const fileUuid = logo[keys.fileUuid]
  if (typeof fileUuid === 'string' && fileUuid.length > 0) return true
  return isValidLogoUrl(logo[keys.url])
}

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
 * Returns file UUIDs referenced by branding image descriptors.
 * @param {object} branding
 * @returns {string[]}
 */
export const getBrandingFileUuids = (branding = {}) => {
  const uuids = []
  for (const imageKey of imageDescriptorKeys) {
    const fileUuid = branding?.[imageKey]?.[keys.fileUuid]
    if (typeof fileUuid === 'string' && fileUuid.length > 0) uuids.push(fileUuid)
  }
  return uuids
}
