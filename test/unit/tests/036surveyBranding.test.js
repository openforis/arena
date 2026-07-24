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
          surveyLogo: { url: 'https://example.com/a.png' },
          countryLogo: { url: 'https://example.com/b.png' },
        })
      ).toBe(true)
    })

    it('rejects invalid primary color when non-empty', () => {
      expect(SurveyBranding.isBrandingValid({ primaryColor: 'nope' })).toBe(false)
    })

    it('rejects invalid logo URL when non-empty', () => {
      expect(SurveyBranding.isBrandingValid({ surveyLogo: { url: 'http://insecure' } })).toBe(false)
      expect(SurveyBranding.isBrandingValid({ countryLogo: { url: 'javascript:alert(1)' } })).toBe(false)
    })

    it('allows fileUuid logos without url', () => {
      expect(SurveyBranding.isBrandingValid({ surveyLogo: { fileUuid: 'abc' } })).toBe(true)
    })
  })

  describe('getBrandingFileUuids', () => {
    it('collects fileUuids from survey and country logos', () => {
      const uuids = SurveyBranding.getBrandingFileUuids({
        surveyLogo: { fileUuid: 'a' },
        countryLogo: { fileUuid: 'b', url: 'https://x.com/y.png' },
      })
      expect(uuids.sort()).toEqual(['a', 'b'])
    })
  })
})
