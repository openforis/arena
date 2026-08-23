import * as SurveyInfo from '@core/survey/_survey/surveyInfo'

describe('SurveyInfo', () => {
  describe('getAppVersion', () => {
    it('returns the app version when present', () => {
      const surveyInfo = { appVersion: '1.2.3' }
      expect(SurveyInfo.getAppVersion(surveyInfo)).toBe('1.2.3')
    })

    it('returns null when app version is not set', () => {
      expect(SurveyInfo.getAppVersion({})).toBeNull()
    })
  })
})
