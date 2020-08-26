import {
  button,
  clearTextBox,
  click,
  expectExists,
  writeIntoTextBox,
  hoverTextBox,
  toRightOf,
  waitFor1sec,
} from '../utils/api'
import { clickHomeBtnEditSurveyInfo, waitForLoader, clickSidebarBtnHome } from '../utils/ui'

const verifyHomeDashboard = async ({ label }) => {
  await expectExists({ selector: '.home-dashboard' })
  await expectExists({ text: label })
}

const selectors = {
  name: { id: 'survey-info-name' },
}

describe('Survey info edit', () => {
  test('Survey require name', async () => {
    await waitFor1sec()
    await clickHomeBtnEditSurveyInfo()

    await clearTextBox({ selector: selectors.name })

    await click(button('Save'))
    await waitForLoader()

    await hoverTextBox({ selector: selectors.name })
    await expectExists({ text: 'Name is required' })

    await waitFor1sec()
    await clickSidebarBtnHome()
    await verifyHomeDashboard({ label: 'Survey 1' })
  })

  test('Survey info save', async () => {
    await clickHomeBtnEditSurveyInfo()

    await clearTextBox({ selector: selectors.name })
    await writeIntoTextBox({ text: 'survey', selector: selectors.name })

    await clearTextBox({ selector: toRightOf('Label') })
    await writeIntoTextBox({ text: 'Survey', selector: toRightOf('Label') })

    await writeIntoTextBox({ text: 'Fr', selector: toRightOf('Language(s)') })
    await click('French')

    await click(button('Save'))
    await waitForLoader()

    await clickSidebarBtnHome()

    await verifyHomeDashboard({ label: 'Survey' })
    await waitFor1sec()
    await clickHomeBtnEditSurveyInfo()

    await expectExists({ text: 'survey', selector: selectors.name })
    await expectExists({ text: 'Survey', selector: toRightOf('Label') })
    await expectExists({ text: 'French', selector: toRightOf('Language(s)') })
    await expectExists({ text: 'English', selector: toRightOf('Language(s)') })
  })
})
