import { expectExists, fileSelect, getElement, reload, waitFor } from '../utils/api'
import { expectHomeDashboard } from '../utils/ui/home'
import { closeJobMonitor, expectExistsJobMonitorSucceeded } from '../utils/ui/jobMonitor'
import { clickHeaderBtnCreateSurvey } from '../utils/ui/header'
import { deleteSurvey } from '../utils/ui/deleteSurvey'

const basePath = process.env.GITHUB_WORKSPACE || __dirname
const downloadPath = basePath
const fileZipName = 'survey_survey.zip'
// const surveyZipPath = path.join(downloadPath, fileZipName)

let surveyName = null
// ${name}-import-yyyy-MM-dd_hh-mm-ss
const surveyTitleRegExp = new RegExp(
  /survey-import-([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])_\d{2}-\d{2}-\d{2}) - Survey/
)
describe('Survey import', () => {
  test('Upload survey zip', async () => {
    await reload()
    await waitFor(5000)

    await clickHeaderBtnCreateSurvey()
    await fileSelect({ inputFileId: 'import-from-arena', fileRoot: downloadPath, fileName: fileZipName })

    await waitFor(5000)

    await expectExistsJobMonitorSucceeded()
    await closeJobMonitor()

    await expectHomeDashboard({ label: 'Survey' })

    await waitFor(5000)

    const headerSurveyTitle = await getElement({ selector: '.header__survey-title' })
    const headerSurveyTitleValue = await headerSurveyTitle.text()

    const [_surveyName, surveyLabel] = headerSurveyTitleValue.split(' - ')
    surveyName = _surveyName

    await expect(surveyTitleRegExp.test(headerSurveyTitleValue)).toBe(true)
    await expect(surveyLabel).toBe('Survey')

    await expectExists({ text: 'SURVEY' })
  }, 30000)

  test('delete a survey with name "survey" and label "Survey"', async () => {
    await deleteSurvey({ name: surveyName, label: 'Survey', needsToFind: false })
  })
})
