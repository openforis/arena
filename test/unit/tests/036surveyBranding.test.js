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

  describe('isValidLogoUrl', () => {
    test.each([
      ['https://example.com/logo.png', true],
      ['http://example.com/logo.png', false],
      ['javascript:alert(1)', false],
      ['', false],
      [null, false],
    ])('%s → %s', (value, expected) => {
      expect(SurveyBranding.isValidLogoUrl(value)).toBe(expected)
    })
  })

  describe('resolveLogoSrc', () => {
    const getFileDownloadUrl = ({ surveyId, fileUuid }) => `/api/survey/${surveyId}/file/${fileUuid}`

    it('prefers fileUuid over url', () => {
      const src = SurveyBranding.resolveLogoSrc(
        { fileUuid: 'abc', url: 'https://example.com/x.png' },
        { surveyId: 1, getFileDownloadUrl }
      )
      expect(src).toBe('/api/survey/1/file/abc')
    })

    it('uses https url when no fileUuid', () => {
      const src = SurveyBranding.resolveLogoSrc(
        { url: 'https://example.com/x.png' },
        { surveyId: 1, getFileDownloadUrl }
      )
      expect(src).toBe('https://example.com/x.png')
    })

    it('returns null for invalid logo', () => {
      expect(SurveyBranding.resolveLogoSrc(null, { surveyId: 1, getFileDownloadUrl })).toBeNull()
      expect(
        SurveyBranding.resolveLogoSrc({ url: 'http://insecure' }, { surveyId: 1, getFileDownloadUrl })
      ).toBeNull()
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

    it('accepts valid primary color and logo URLs', () => {
      expect(
        SurveyBranding.isBrandingValid({
          primaryColor: '#112233',
          surveyLogo1: { url: 'https://example.com/a.png' },
          surveyLogo2: { url: 'https://example.com/b.png' },
          surveyLogo3: { url: 'https://example.com/c.png' },
        })
      ).toBe(true)
    })

    it('rejects invalid primary color when non-empty', () => {
      expect(SurveyBranding.isBrandingValid({ primaryColor: 'nope' })).toBe(false)
    })

    it('rejects invalid logo URL when non-empty', () => {
      expect(SurveyBranding.isBrandingValid({ surveyLogo1: { url: 'http://insecure' } })).toBe(false)
      expect(SurveyBranding.isBrandingValid({ surveyLogo2: { url: 'javascript:alert(1)' } })).toBe(false)
    })

    it('allows fileUuid logos without url', () => {
      expect(SurveyBranding.isBrandingValid({ surveyLogo1: { fileUuid: 'abc' } })).toBe(true)
    })
  })

  describe('getBrandingFileUuids', () => {
    it('collects fileUuids from all survey logos', () => {
      const uuids = SurveyBranding.getBrandingFileUuids({
        surveyLogo1: { fileUuid: 'a' },
        surveyLogo2: { fileUuid: 'b', url: 'https://x.com/y.png' },
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
            surveyLogo3: { url: 'https://example.com/3.png' },
          },
        },
      }
      expect(SurveyBranding.getSurveyLogos(surveyInfo)).toEqual([
        { fileUuid: '1' },
        null,
        { url: 'https://example.com/3.png' },
      ])
    })
  })

  describe('hasLogoDescriptor', () => {
    it('detects fileUuid and valid https url', () => {
      expect(SurveyBranding.hasLogoDescriptor({ fileUuid: 'a' })).toBe(true)
      expect(SurveyBranding.hasLogoDescriptor({ url: 'https://example.com/x.png' })).toBe(true)
      expect(SurveyBranding.hasLogoDescriptor({ url: 'http://insecure' })).toBe(false)
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

    it('accepts valid landing background url', () => {
      expect(
        SurveyBranding.isBrandingValid({
          landingBackground: { url: 'https://example.com/bg.jpg' },
        })
      ).toBe(true)
    })
  })
})
