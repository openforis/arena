import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { BASE_URL } from '../config'
import { templates } from '../mock/survey'
import { gotoHome, gotoTemplateList } from './_navigation'
import { clickSurvey } from './_surveyList'
import { expectNoItems } from './_tables'

export default () =>
  describe('Template Delete', () => {
    gotoTemplateList()

    describe.each(Array.from(Array(templates.length).keys()))(`Delete template %s`, (idx) => {
      const template = templates[idx]

      test(`Goto template ${idx}`, async () => {
        await clickSurvey(template)
      })

      test(`Delete template ${template.name}`, async () => {
        const { name } = template

        await page.click(getSelector(DataTestId.dashboard.surveyDeleteBtn, 'button'))
        await page.fill(getSelector(DataTestId.surveyDelete.confirmNameInput), name)

        // Click div[role="dialog"] >> text="Delete"
        await Promise.all([
          page.waitForNavigation(/* { url: `{BASE_URL}/app/home/templates/` } */),
          page.click('div[role="dialog"] >> text="Delete"'),
        ])

        await expect(page.url()).toBe(`${BASE_URL}/app/home/templates/`)

        await expect(page).toHaveText(`Survey ${name} has been deleted`)
      })

      test(`Verify template ${idx} deleted`, async () => {
        if (idx === templates.length - 1) {
          // last template deleted
          await expectNoItems()
        } else {
          const expectedTemplatesCount = templates.length - (idx + 1)

          const rowsSelector = getSelector(DataTestId.table.rows(DataTestId.templateList.module))
          await page.waitForSelector(rowsSelector)
          const templatesEl = await page.$$(`${rowsSelector} > div`)
          await expect(templatesEl.length).toBe(expectedTemplatesCount)
        }
      })
    })

    gotoHome()
  })
