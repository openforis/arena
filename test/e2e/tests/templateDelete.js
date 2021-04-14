import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { template, template2, templateCloned } from '../mock/survey'
import { gotoTemplateList } from './_navigation'
import { clickSurvey } from './_surveyList'

const deleteTemplate = async (templateToDelete) => {
  const { name } = templateToDelete

  await clickSurvey(templateToDelete)

  await page.click(getSelector(DataTestId.dashboard.surveyDeleteBtn, 'button'))
  await page.fill('input[type="text"]', name)

  // Click div[role="dialog"] >> text="Delete"
  await Promise.all([
    page.waitForNavigation(/* { url: `{BASE_URL}/app/home/templates/` } */),
    page.click('div[role="dialog"] >> text="Delete"'),
  ])

  await expect(page).toHaveText(`Survey ${name} has been deleted`)
}

export default () =>
  describe('Template Delete', () => {
    gotoTemplateList()
    test('Delete template', async () => deleteTemplate(template))

    gotoTemplateList()
    test('Delete template2', async () => deleteTemplate(template2))

    gotoTemplateList()
    test('Delete templateCloned', async () => deleteTemplate(templateCloned))

    gotoTemplateList()
    test('Verify template list empty', async () => {
      await expect(page).toHaveText('No Items')
    })
  })
