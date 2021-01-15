import { button, clearTextBox, click, expectExists, writeIntoTextBox, hoverTextBox } from '../utils/api'

import { clickHomeBtnEditSurveyInfo, expectHomeDashboard } from '../utils/ui/home'
import { waitForLoader } from '../utils/ui/loader'
import { clickSidebarBtnHome } from '../utils/ui/sidebar'

const selectors = {
  name: () => ({ id: 'survey-name' }),
  label: () => ({ id: 'survey-label-en' }),
  language: () => ({ id: 'survey-language' }),
}

describe('Survey info edit', () => {
  test('Survey require name', async () => {
    await clickHomeBtnEditSurveyInfo()

    await clearTextBox({ selector: selectors.name() })

    await click(button('Save'))
    await waitForLoader()

    await hoverTextBox({ selector: selectors.name() })
    await expectExists({ text: 'Name is required' })

    await clickSidebarBtnHome()
    await expectHomeDashboard({ label: 'Survey 1' })
  })

  test('Survey info save', async () => {
    await clickHomeBtnEditSurveyInfo()

    await clearTextBox({ selector: selectors.name() })
    await writeIntoTextBox({ text: 'survey', selector: selectors.name() })

    await clearTextBox({ selector: selectors.label() })
    await writeIntoTextBox({ text: 'Survey', selector: selectors.label() })

    await writeIntoTextBox({ text: 'Fr', selector: selectors.language() })
    await click('French')

    await click(button('Save'))
    await waitForLoader()

    await clickSidebarBtnHome()

    await expectHomeDashboard({ label: 'Survey' })
    await waitForLoader()
    await clickHomeBtnEditSurveyInfo()

    await expectExists({ text: 'survey', selector: selectors.name() })
    await expectExists({ text: 'Survey', selector: selectors.label() })
    await expectExists({ text: 'French', selector: selectors.language() })
    await expectExists({ text: 'English', selector: selectors.language() })
  })
})
