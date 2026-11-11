import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { cluster } from '../fixtures/seed/sampleSurveyModel'
import { FormDesigner } from '../helpers/formDesigner'
import { publishSurvey } from '../helpers/publish'
import { RecordForm } from '../helpers/recordForm'
import { exportSurvey } from '../helpers/surveyExport'
import { Urls } from '../helpers/urls'

const c = cluster.children
const { requiredIf, validations } = TestId.nodeDefDetails

const requiredIfExpression = 'cluster_id > 10'

test.describe('Required if', () => {
  test.slow()

  test.use({ sampleSurveyOptions: { withExpressions: false, publish: false } })

  test('attribute required only when its condition is met', async ({ page, sampleSurvey: _ }, testInfo) => {
    // designer: "Required when condition is met"
    const designer = new FormDesigner(page)
    await designer.goto()
    await designer.edit(c.cluster_decimal.name)
    await designer.gotoTab(validations)
    await designer.editExpression({ qualifier: requiredIf, expression: requiredIfExpression })
    await designer.saveAndBack(c.cluster_decimal.label)

    await publishSurvey(page)

    const surveyExport = await exportSurvey(page, testInfo, { withData: false })
    const clusterDecimalValidations = surveyExport.nodeDefByName(c.cluster_decimal.name).propsAdvanced?.validations
    expect(clusterDecimalValidations?.required).toBeFalsy()
    expect(clusterDecimalValidations?.requiredIf?.map(({ expression }) => expression)).toEqual([
      `${requiredIfExpression}\n`,
    ])

    // data entry
    const form = new RecordForm(page)

    await page.goto(Urls.records)
    await page.getByTestId(TestId.records.addBtn).click()
    await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()

    // condition not met (cluster_id empty)
    await expect(form.errorBadge(c.cluster_decimal.name)).toHaveCount(0)

    // condition met: "Required value" error
    await form.enter(c.cluster_id, '11')
    await form.expectError(c.cluster_decimal.name, 'Required value')

    // value entered: no error
    await form.enter(c.cluster_decimal, '12.5')
    await expect(form.errorBadge(c.cluster_decimal.name)).toHaveCount(0)

    // value cleared: error again
    await form.enter(c.cluster_decimal, '')
    await form.expectError(c.cluster_decimal.name, 'Required value')

    // condition not met anymore: no error
    await form.enter(c.cluster_id, '5')
    await expect(form.errorBadge(c.cluster_decimal.name)).toHaveCount(0)
  })
})
