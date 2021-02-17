import { clickParent, waitFor } from '../api'
import { clickHeaderBtnMySurveys } from './header'
import { waitForLoader } from './loader'

export const selectSurvey = async ({ label = 'Survey' } = {}) => {
  await waitFor(3000)
  await clickHeaderBtnMySurveys()
  await clickParent(label)

  await waitFor(3000)
  await waitForLoader()

  await waitFor(3000)
}
