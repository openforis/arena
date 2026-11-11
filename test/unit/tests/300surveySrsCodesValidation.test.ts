import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as Validation from '@core/validation/validation'

const newSurveyInfo = (srs: unknown) =>
  Survey.newSurvey({ ownerUuid: 'owner-uuid', name: 'survey_test', languages: ['en'], srs })

const getSrsErrors = async (srs: unknown) => {
  const validation = await SurveyValidator.validateSurveyInfo(newSurveyInfo(srs))
  return Validation.getErrors(Validation.getFieldValidation(Survey.infoKeys.srs)(validation))
}

describe('Survey spatial reference system codes', () => {
  test('EPSG codes are valid', async () => {
    expect(
      await getSrsErrors([
        { code: '4326', name: 'WGS 84' },
        { code: 32633, name: 'UTM 33N' },
      ])
    ).toEqual([])
    expect(SurveyValidator.getInvalidSrsCodes([{ code: '4326' }, { code: 3857 }])).toEqual([])
  })

  test.each([['EPSG:4326'], ["4326'"], ['4326; x'], [''], [null]])('code %p is not valid', async (code) => {
    expect(
      await getSrsErrors([
        { code: '4326', name: 'WGS 84' },
        { code, name: 'other' },
      ])
    ).toEqual([
      expect.objectContaining({
        key: Validation.messageKeys.surveyInfoEdit.srsInvalid,
        params: { code: [code].join(', ') },
      }),
    ])
    expect(SurveyValidator.getInvalidSrsCodes([{ code }])).toEqual([code])
  })
})
