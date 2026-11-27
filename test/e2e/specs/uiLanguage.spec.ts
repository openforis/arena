import enCommon from '@core/i18n/resources/en/common'
import esCommon from '@core/i18n/resources/es/common'
import frCommon from '@core/i18n/resources/fr/common'
import { TestId } from '@webapp/utils/testId'
import { expect, test } from '../fixtures'
import { resetTestUserLanguagePref } from '../fixtures/testUsers'
import { Urls } from '../helpers/urls'

// the title of the language button, in the UI language
const languageButtonTitleByLang: Record<string, string> = {
  en: enCommon.userView.preferredUILanguage.label,
  es: esCommon.userView.preferredUILanguage.label,
  fr: frCommon.userView.preferredUILanguage.label,
}

test.describe('UI language (header)', () => {
  test.afterEach(async ({ testUser }) => {
    await resetTestUserLanguagePref(testUser)
  })

  test('the chosen language is applied at once, also when it is loaded for the first time', async ({ page }) => {
    await page.goto(Urls.home)
    const languageBtn = page.getByTestId(TestId.header.uiLanguageBtn)

    const expectLanguage = async (lang: string) => {
      await expect(languageBtn).toHaveText(lang.toUpperCase())
      await expect(languageBtn).toHaveAccessibleName(languageButtonTitleByLang[lang])
    }

    const chooseLanguage = async (lang: string) => {
      await languageBtn.click()
      await page.getByTestId(TestId.header.uiLanguageItem(lang)).click()
      await expectLanguage(lang)
    }

    await expectLanguage('en')
    // each choice shows the language just chosen, not the previous one
    await chooseLanguage('es')
    await chooseLanguage('fr')
    await chooseLanguage('en')
    await chooseLanguage('es')

    // the preferred language is kept after a reload
    await page.reload()
    await expectLanguage('es')
  })
})
