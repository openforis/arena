import * as SurveyBranding from '@core/survey/surveyBranding'

describe('SurveyBranding', () => {
  describe('isValidPrimaryColor', () => {
    test.each([
      ['#3885ca', true],
      ['#3885CA', true],
      ['#fff', false],
      ['3885ca', false],
      ['', false],
      [null, false],
      ['javascript:alert(1)', false],
    ])('%s → %s', (value, expected) => {
      expect(SurveyBranding.isValidPrimaryColor(value)).toBe(expected)
    })
  })

  describe('getPrimaryColor', () => {
    it('returns valid color from branding prop', () => {
      const surveyInfo = { props: { branding: { primaryColor: '#112233' } } }
      expect(SurveyBranding.getPrimaryColor(surveyInfo)).toBe('#112233')
    })

    it('returns null for invalid color', () => {
      const surveyInfo = { props: { branding: { primaryColor: 'nope' } } }
      expect(SurveyBranding.getPrimaryColor(surveyInfo)).toBeNull()
    })
  })

  describe('isBrandingValid', () => {
    it('accepts empty branding', () => {
      expect(SurveyBranding.isBrandingValid({})).toBe(true)
    })

    it('accepts valid primary color and file-based logos', () => {
      expect(
        SurveyBranding.isBrandingValid({
          primaryColor: '#112233',
          surveyLogo1: { fileUuid: 'a' },
          surveyLogo2: { fileUuid: 'b' },
          surveyLogo3: { fileUuid: 'c' },
        })
      ).toBe(true)
    })

    it('rejects invalid primary color when non-empty', () => {
      expect(SurveyBranding.isBrandingValid({ primaryColor: 'nope' })).toBe(false)
    })

    it('allows fileUuid logos', () => {
      expect(SurveyBranding.isBrandingValid({ surveyLogo1: { fileUuid: 'abc' } })).toBe(true)
    })
  })

  describe('getBrandingFileUuids', () => {
    it('collects fileUuids from all survey logos', () => {
      const uuids = SurveyBranding.getBrandingFileUuids({
        surveyLogo1: { fileUuid: 'a' },
        surveyLogo2: { fileUuid: 'b' },
        surveyLogo3: { fileUuid: 'c' },
      })
      expect(uuids.sort()).toEqual(['a', 'b', 'c'])
    })

    it('collects landing background fileUuid', () => {
      const uuids = SurveyBranding.getBrandingFileUuids({
        landingBackground: { fileUuid: 'bg' },
      })
      expect(uuids).toEqual(['bg'])
    })
  })

  describe('getSurveyLogos', () => {
    it('returns logos in slot order', () => {
      const surveyInfo = {
        props: {
          branding: {
            surveyLogo1: { fileUuid: '1' },
            surveyLogo3: { fileUuid: '3' },
          },
        },
      }
      expect(SurveyBranding.getSurveyLogos(surveyInfo)).toEqual([{ fileUuid: '1' }, null, { fileUuid: '3' }])
    })
  })

  describe('hasLogoDescriptor', () => {
    it('detects fileUuid', () => {
      expect(SurveyBranding.hasLogoDescriptor({ fileUuid: 'a' })).toBe(true)
      expect(SurveyBranding.hasLogoDescriptor({})).toBe(false)
      expect(SurveyBranding.hasLogoDescriptor(null)).toBe(false)
    })
  })

  describe('font size presets', () => {
    it('validates preset values', () => {
      expect(SurveyBranding.isValidFontSizePreset('small')).toBe(true)
      expect(SurveyBranding.isValidFontSizePreset('default')).toBe(true)
      expect(SurveyBranding.isValidFontSizePreset('large')).toBe(true)
      expect(SurveyBranding.isValidFontSizePreset('huge')).toBe(false)
    })

    it('returns rem sizes for title and description', () => {
      const surveyInfo = {
        props: {
          branding: {
            titleFontSize: 'large',
            descriptionFontSize: 'small',
          },
        },
      }
      expect(SurveyBranding.getTitleFontSizeRem(surveyInfo)).toBe('2.5rem')
      expect(SurveyBranding.getDescriptionFontSizeRem(surveyInfo)).toBe('1rem')
    })

    it('defaults to default preset when unset', () => {
      expect(SurveyBranding.getTitleFontSizeRem({ props: { branding: {} } })).toBe('2rem')
      expect(SurveyBranding.getDescriptionFontSizeRem({ props: { branding: {} } })).toBe('1.125rem')
    })
  })

  describe('isBrandingValid font sizes and background', () => {
    it('rejects invalid font size preset', () => {
      expect(SurveyBranding.isBrandingValid({ titleFontSize: 'xl' })).toBe(false)
    })

    it('accepts landing background fileUuid', () => {
      expect(
        SurveyBranding.isBrandingValid({
          landingBackground: { fileUuid: 'bg' },
        })
      ).toBe(true)
    })
  })

  describe('BRANDING_IMAGE_MAX_FILE_SIZE_BYTES', () => {
    it('matches landing background limit', () => {
      expect(SurveyBranding.BRANDING_IMAGE_MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024)
      expect(SurveyBranding.LANDING_BACKGROUND_MAX_FILE_SIZE_BYTES).toBe(
        SurveyBranding.BRANDING_IMAGE_MAX_FILE_SIZE_BYTES
      )
    })
  })
})
