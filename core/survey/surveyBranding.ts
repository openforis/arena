import * as ObjectUtils from '@core/objectUtils'
import * as SurveyFile from '@core/survey/surveyFile'

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
  size: 'size',
  name: 'name',
} as const

export type SurveyLogoKey = typeof keys.surveyLogo1 | typeof keys.surveyLogo2 | typeof keys.surveyLogo3

/** Ordered survey logo prop keys for branding and landing display. */
export const surveyLogoKeys: readonly SurveyLogoKey[] = [keys.surveyLogo1, keys.surveyLogo2, keys.surveyLogo3]

export const fontSizePreset = {
  small: 'small',
  default: 'default',
  large: 'large',
} as const

export type FontSizePreset = (typeof fontSizePreset)[keyof typeof fontSizePreset]

export const fontSizePresetValues = Object.freeze(Object.values(fontSizePreset)) as readonly FontSizePreset[]

/** Maximum branding image upload size in bytes (5 MiB). */
export const BRANDING_IMAGE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

/** Maximum landing background upload size in bytes (5 MiB). */
export const LANDING_BACKGROUND_MAX_FILE_SIZE_BYTES = BRANDING_IMAGE_MAX_FILE_SIZE_BYTES

const HEX_COLOR_REGEXP = /^#[0-9A-Fa-f]{6}$/

const titleFontSizeRemByPreset: Record<FontSizePreset, string> = {
  [fontSizePreset.small]: '1.5rem',
  [fontSizePreset.default]: '2rem',
  [fontSizePreset.large]: '2.5rem',
}

const descriptionFontSizeRemByPreset: Record<FontSizePreset, string> = {
  [fontSizePreset.small]: '1rem',
  [fontSizePreset.default]: '1.125rem',
  [fontSizePreset.large]: '1.25rem',
}

const imageDescriptorKeys = [...surveyLogoKeys, keys.landingBackground] as const

const brandingImageFileTypeByKey: Record<(typeof imageDescriptorKeys)[number], string> = {
  [keys.surveyLogo1]: SurveyFile.SurveyFileType.brandingSurveyLogo1,
  [keys.surveyLogo2]: SurveyFile.SurveyFileType.brandingSurveyLogo2,
  [keys.surveyLogo3]: SurveyFile.SurveyFileType.brandingSurveyLogo3,
  [keys.landingBackground]: SurveyFile.SurveyFileType.brandingLandingBackground,
}

export type BrandingFileSummary = {
  uuid: string
  props: { type: string; size: number; name?: string }
}

export type BrandingImageDescriptor = {
  [keys.fileUuid]?: string
  [keys.size]?: number
  [keys.name]?: string
}

export type SurveyBranding = {
  [keys.primaryColor]?: string
  [keys.surveyLogo1]?: BrandingImageDescriptor
  [keys.surveyLogo2]?: BrandingImageDescriptor
  [keys.surveyLogo3]?: BrandingImageDescriptor
  [keys.landingBackground]?: BrandingImageDescriptor
  [keys.titleFontSize]?: FontSizePreset
  [keys.descriptionFontSize]?: FontSizePreset
}

export type SurveyInfoLike = {
  props?: {
    branding?: SurveyBranding
  }
  [key: string]: unknown
}

/**
 * Returns whether value is a valid font size preset.
 */
export const isValidFontSizePreset = (value: unknown): value is FontSizePreset =>
  typeof value === 'string' && (fontSizePresetValues as readonly string[]).includes(value)

/**
 * Returns whether value is a valid #RRGGBB primary color.
 */
export const isValidPrimaryColor = (value: unknown): value is string =>
  typeof value === 'string' && HEX_COLOR_REGEXP.test(value)

/**
 * Returns whether branding props are valid for save.
 * Empty optional fields are allowed.
 */
export const isBrandingValid = (branding: SurveyBranding = {}): boolean => {
  const primaryColor = branding[keys.primaryColor]
  if (primaryColor && !isValidPrimaryColor(primaryColor)) return false

  const titleFontSize = branding[keys.titleFontSize]
  if (titleFontSize && !isValidFontSizePreset(titleFontSize)) return false

  const descriptionFontSize = branding[keys.descriptionFontSize]
  if (descriptionFontSize && !isValidFontSizePreset(descriptionFontSize)) return false

  return true
}

/**
 * Returns branding object from survey info props.
 */
export const getBranding = (surveyInfo: SurveyInfoLike): SurveyBranding =>
  (ObjectUtils.getProp(keys.branding, {})(surveyInfo) as SurveyBranding) || {}

/**
 * Returns validated primary color or null.
 */
export const getPrimaryColor = (surveyInfo: SurveyInfoLike): string | null => {
  const color = getBranding(surveyInfo)[keys.primaryColor]
  return isValidPrimaryColor(color) ? color : null
}

/**
 * Returns title font size preset or default.
 */
export const getTitleFontSizePreset = (surveyInfo: SurveyInfoLike): FontSizePreset => {
  const preset = getBranding(surveyInfo)[keys.titleFontSize]
  return isValidFontSizePreset(preset) ? preset : fontSizePreset.default
}

/**
 * Returns description font size preset or default.
 */
export const getDescriptionFontSizePreset = (surveyInfo: SurveyInfoLike): FontSizePreset => {
  const preset = getBranding(surveyInfo)[keys.descriptionFontSize]
  return isValidFontSizePreset(preset) ? preset : fontSizePreset.default
}

/**
 * Returns CSS font-size for the landing title.
 */
export const getTitleFontSizeRem = (surveyInfo: SurveyInfoLike): string =>
  titleFontSizeRemByPreset[getTitleFontSizePreset(surveyInfo)]

/**
 * Returns CSS font-size for the landing description.
 */
export const getDescriptionFontSizeRem = (surveyInfo: SurveyInfoLike): string =>
  descriptionFontSizeRemByPreset[getDescriptionFontSizePreset(surveyInfo)]

/**
 * Returns a survey logo descriptor by slot index (1-based).
 */
export const getSurveyLogoBySlot = (surveyInfo: SurveyInfoLike, slot: 1 | 2 | 3): BrandingImageDescriptor | null => {
  const logoKey = surveyLogoKeys[slot - 1]
  return logoKey ? getBranding(surveyInfo)[logoKey] || null : null
}

/**
 * Returns survey logo descriptors in display order (slots 1–3).
 */
export const getSurveyLogos = (surveyInfo: SurveyInfoLike): Array<BrandingImageDescriptor | null> =>
  surveyLogoKeys.map((logoKey) => getBranding(surveyInfo)[logoKey] || null)

export const getLandingBackground = (surveyInfo: SurveyInfoLike): BrandingImageDescriptor | null =>
  getBranding(surveyInfo)[keys.landingBackground] || null

/**
 * Returns whether a logo descriptor has a file UUID.
 */
export const hasLogoDescriptor = (logo: BrandingImageDescriptor | null | undefined): boolean => {
  if (!logo || typeof logo !== 'object') return false
  const fileUuid = logo[keys.fileUuid]
  return typeof fileUuid === 'string' && fileUuid.length > 0
}

/**
 * Returns file UUIDs referenced by branding image descriptors.
 */
export const getBrandingFileUuids = (branding: SurveyBranding = {}): string[] => {
  const uuids: string[] = []
  for (const imageKey of imageDescriptorKeys) {
    const fileUuid = branding?.[imageKey]?.[keys.fileUuid]
    if (typeof fileUuid === 'string' && fileUuid.length > 0) uuids.push(fileUuid)
  }
  return uuids
}

/**
 * Returns file summaries ({ uuid, props: { type, size, name? } }) for every branding image
 * descriptor that has a fileUuid, keyed by the SurveyFileType matching its branding slot.
 * size/name are read from the descriptor when present (uploaded after this field was added);
 * descriptors from before then only ever stored fileUuid, so size falls back to 0 and name is
 * omitted for those. Used by survey export/import to restore branding image file content.
 */
export const getBrandingFileSummaries = (branding: SurveyBranding = {}): BrandingFileSummary[] => {
  const summaries: BrandingFileSummary[] = []
  for (const imageKey of imageDescriptorKeys) {
    const descriptor = branding?.[imageKey]
    const fileUuid = descriptor?.[keys.fileUuid]
    if (typeof fileUuid === 'string' && fileUuid.length > 0) {
      const size = descriptor?.[keys.size]
      const name = descriptor?.[keys.name]
      summaries.push({
        uuid: fileUuid,
        props: {
          type: brandingImageFileTypeByKey[imageKey],
          size: typeof size === 'number' ? size : 0,
          ...(name ? { name } : {}),
        },
      })
    }
  }
  return summaries
}
