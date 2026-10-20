import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { FormDesigner } from '../helpers/formDesigner'
import { publishSurvey } from '../helpers/publish'
import { exportSurvey } from '../helpers/surveyExport'

const { advanced, defaultValues, relevantIf, validations } = TestId.nodeDefDetails

test.describe('Node def expressions', () => {
  // long UI flow (many node defs edited and saved one by one)
  test.slow()

  test.use({ sampleSurveyOptions: { withExpressions: false, publish: false } })

  test('edits default values, relevancy and validation expressions', async ({ page, sampleSurvey: _ }, testInfo) => {
    const designer = new FormDesigner(page)
    await designer.goto()

    const editExpressions = async (
      nodeDef: { name: string; label: string },
      tab: string,
      expressions: Parameters<FormDesigner['editExpression']>[0][]
    ) => {
      await designer.edit(nodeDef.name)
      await designer.gotoTab(tab)
      for (const expression of expressions) {
        await designer.editExpression(expression)
      }
      await designer.saveAndBack(nodeDef.label)
    }

    // cluster
    await editExpressions({ name: 'cluster_date', label: 'Cluster date' }, advanced, [
      { qualifier: defaultValues, expression: 'now()' },
    ])
    await editExpressions({ name: 'cluster_time', label: 'Cluster time' }, advanced, [
      { qualifier: defaultValues, expression: 'now()' },
    ])
    await editExpressions({ name: 'cluster_boolean', label: 'Cluster boolean' }, advanced, [
      { qualifier: defaultValues, expression: 'True', editor: 'boolean' },
    ])
    await editExpressions({ name: 'cluster_country', label: 'Cluster country' }, advanced, [
      { qualifier: defaultValues, expression: '0', editor: 'dropdown' },
    ])

    // plot and tree
    await designer.gotoPage('plot')
    await editExpressions({ name: 'plot', label: 'Plot' }, advanced, [
      { qualifier: relevantIf, expression: 'cluster_id > 0' },
    ])
    await editExpressions({ name: 'tree_dec_1', label: 'Tree decimal 1' }, validations, [
      { qualifier: validations, expression: 'tree_dec_1 > 0' },
    ])
    await editExpressions({ name: 'tree_dec_2', label: 'Tree decimal 2' }, validations, [
      { qualifier: validations, index: 0, expression: 'tree_dec_2 > 0', applyIf: 'tree_dec_1 > 10' },
      { qualifier: validations, index: 1, expression: 'tree_dec_2 > 10' },
    ])
    await editExpressions({ name: 'tree_species', label: 'Tree Species' }, advanced, [
      { qualifier: defaultValues, expression: 'ALB/GLA', editor: 'dropdown' },
    ])

    await publishSurvey(page)

    const surveyExport = await exportSurvey(page, testInfo, { withData: false })
    const propsAdvanced = (name: string) => surveyExport.nodeDefByName(name).propsAdvanced ?? {}
    const expressionsOf = (items: { expression: string; applyIf?: string }[] = []) =>
      items.map(({ expression, applyIf }) => (applyIf ? { expression, applyIf } : { expression }))

    // expressions written with the advanced editor are stored with a trailing new line (to reopen them in the same editor)
    const adv = (expression: string) => `${expression}\n`

    expect(expressionsOf(propsAdvanced('cluster_date').defaultValues)).toEqual([{ expression: adv('now()') }])
    expect(expressionsOf(propsAdvanced('cluster_time').defaultValues)).toEqual([{ expression: adv('now()') }])
    expect(expressionsOf(propsAdvanced('cluster_boolean').defaultValues)).toEqual([{ expression: 'true' }])
    expect(expressionsOf(propsAdvanced('cluster_country').defaultValues)).toEqual([{ expression: '"0"' }])
    expect(expressionsOf(propsAdvanced('plot').applicable)).toEqual([{ expression: adv('cluster_id > 0') }])
    expect(expressionsOf(propsAdvanced('tree_dec_1').validations?.expressions)).toEqual([
      { expression: adv('tree_dec_1 > 0') },
    ])
    expect(expressionsOf(propsAdvanced('tree_dec_2').validations?.expressions)).toEqual([
      { expression: adv('tree_dec_2 > 0'), applyIf: adv('tree_dec_1 > 10') },
      { expression: adv('tree_dec_2 > 10') },
    ])
    expect(expressionsOf(propsAdvanced('tree_species').defaultValues)).toEqual([{ expression: '"ALB/GLA"' }])
  })
})
