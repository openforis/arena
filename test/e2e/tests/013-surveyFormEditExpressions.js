import { click, waitFor1sec } from '../utils/api'
import { editNodeDef } from '../utils/ui/surveyForm'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { clickNodeDefSaveAndBack, expectNodeDefUnchanged } from '../utils/ui/nodeDefDetail'
import {
  addNodeDefExpression,
  deleteNodeDefExpression,
  expectExpressionItemsToBe,
  expectNodeDefExpression,
  expectNodeDefExpressionsInvalid,
  expectNodeDefExpressionsValid,
} from '../utils/ui/nodeDefDetailsAdvanced'

import { qualifiers } from '../utils/ui/nodeDefDetailsAdvancedSelectors'

describe('SurveyForm edit expressions', () => {
  test('open surveyForm Cluster', async () => {
    await clickSidebarBtnSurveyForm()
    await click('Cluster')
  })

  test('add Default Value "0" to "Cluster decimal"', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster decimal' })

    await click('Advanced')

    const qualifier = qualifiers.defaultValues

    await addNodeDefExpression({
      qualifier,
      expression: { binaryExpression: { left: { constant: '0' } } },
      expressionText: '0',
    })

    await expectNodeDefExpressionsValid({ qualifier })
  })

  test('add another Default Value to "cluster_decimal" without Apply If (error)', async () => {
    const qualifier = qualifiers.defaultValues

    await addNodeDefExpression({
      qualifier,
      expression: { binaryExpression: { left: { constant: '1' } } },
      expressionText: '1',
    })
    await expectNodeDefExpressionsInvalid({ qualifier })

    // delete the first default value
    await deleteNodeDefExpression({ qualifier })

    // expect the "new" default value to be the first one
    await expectNodeDefExpression({ qualifier, text: '1' })

    await expectNodeDefExpressionsValid({ qualifier })

    await clickNodeDefSaveAndBack()
  }, 60000)

  test('add Default Value "now()" to cluster_date', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster date' })

    await click('Advanced')

    const qualifier = qualifiers.defaultValues
    await addNodeDefExpression({
      qualifier,
      expression: { expression: 'now()' },
      expressionText: `now()`,
    })

    await clickNodeDefSaveAndBack()
  })

  test('add "Relevant if cluster_decimal > 0" to "Cluster date"', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster date' })

    await click('Advanced')

    const qualifier = qualifiers.relevantIf

    await addNodeDefExpression({
      qualifier,
      expression: {
        binaryExpression: { left: { identifier: 'cluster_decimal' }, operator: '>', right: { constant: '0' } },
      },
      expressionText: `cluster_decimal > 0`,
    })

    await clickNodeDefSaveAndBack()
  }, 60000)

  test('add Default Value to cluster_time', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster time' })

    await click('Advanced')

    const qualifier = qualifiers.defaultValues
    const expression = 'now()'

    await addNodeDefExpression({ qualifier, expression: { expression }, expressionText: expression })

    await clickNodeDefSaveAndBack()
  })

  test('add Default Value to "cluster_boolean" as "true" if "cluster_decimal" value is > 5, "false" otherwise', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster boolean' })

    await click('Advanced')

    const qualifier = qualifiers.defaultValues

    const applyIfExpression = `cluster_decimal > '5'`

    await addNodeDefExpression({
      qualifier,
      expression: { binaryExpression: { left: { constantBoolean: 'True' } } },
      expressionText: `"true"`,
      applyIf: {
        expression: applyIfExpression,
      },
      applyIfText: applyIfExpression,
    })

    await addNodeDefExpression({
      qualifier,
      expression: { binaryExpression: { left: { constantBoolean: 'False' } } },
      expressionText: `"false"`,
    })

    await clickNodeDefSaveAndBack()
    await waitFor1sec()
  }, 60000)

  // Validations

  test('add Validation to "cluster_decimal": cluster_decimal < 10 if cluster_id = 1', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster decimal' })

    await click('Validations')

    const qualifier = qualifiers.validations

    // expect to have only expression placeholder
    await expectExpressionItemsToBe({ qualifier, count: 1 })

    await addNodeDefExpression({
      qualifier,
      expression: {
        binaryExpression: { left: { identifier: 'cluster_decimal' }, operator: '<', right: { constant: '10' } },
      },
      expressionText: 'cluster_decimal < 10',
      applyIf: {
        binaryExpression: { left: { identifier: 'cluster_id' }, operator: '=', right: { constant: '1' } },
      },
      applyIfText: 'cluster_id == 1',
    })

    await expectExpressionItemsToBe({ qualifier, count: 2 })

    await clickNodeDefSaveAndBack()
  }, 60000)

  test('add Validation and delete it: no changes applied', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster decimal' })

    await click('Validations')

    const qualifier = qualifiers.validations

    // check previously defined validation
    await expectExpressionItemsToBe({ qualifier, count: 2 })
    await expectNodeDefExpression({ qualifier, text: 'cluster_decimal < 10' })

    // add validation and delete it: no changes applied to the node def (save button disabled)

    await addNodeDefExpression({
      qualifier,
      expression: {
        binaryExpression: { left: { identifier: 'cluster_decimal' }, operator: '<', right: { constant: '20' } },
      },
      expressionText: 'cluster_decimal < 20',
    })

    await deleteNodeDefExpression({ qualifier, index: 1 })

    await expectNodeDefUnchanged()
  })

  test('add Validation to "cluster_decimal": cluster_decimal < 20 if cluster_id = 2', async () => {
    const qualifier = qualifiers.validations

    await addNodeDefExpression({
      qualifier,
      expression: {
        binaryExpression: { left: { identifier: 'cluster_decimal' }, operator: '<', right: { constant: '20' } },
      },
      expressionText: 'cluster_decimal < 20',
      applyIf: {
        binaryExpression: { left: { identifier: 'cluster_id' }, operator: '=', right: { constant: '2' } },
      },
      applyIfText: 'cluster_id == 2',
    })

    await clickNodeDefSaveAndBack()
  }, 60000)

  test('add Validation to "cluster_decimal": cluster_decimal < cluster_id*10 if cluster_id > 20', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster decimal' })

    await click('Validations')

    const qualifier = qualifiers.validations
    const expression = 'cluster_decimal < cluster_id * 10'
    const applyIfExpression = 'cluster_id > 20'

    await addNodeDefExpression({
      qualifier,
      expression: {
        expression,
      },
      expressionText: expression,
      applyIf: {
        expression: applyIfExpression,
      },
      applyIfText: applyIfExpression,
    })

    await clickNodeDefSaveAndBack()
  }, 60000)

  test('add Validation to "cluster_date": cluster_date >= "2021-01-01" and cluster_date <= now()', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster date' })

    await click('Validations')

    await addNodeDefExpression({
      qualifier: qualifiers.validations,
      expression: {
        binaryExpression: { left: { identifier: 'cluster_date' }, operator: '>=', right: { constant: '2021-01-01' } },
      },
      expressionText: 'cluster_date >= "2021-01-01"',
    })

    await addNodeDefExpression({
      qualifier: qualifiers.validations,
      expression: { expression: 'cluster_date <= now()' },
      expressionText: 'cluster_date <= now()',
    })

    await clickNodeDefSaveAndBack()
  }, 60000)

  // Plot attributes
  test('add "Relevant if !isEmpty(plot_id)" to "Plot text"', async () => {
    await click('Plot')

    await editNodeDef({ nodeDefLabel: 'Plot text' })

    await click('Advanced')

    const qualifier = qualifiers.relevantIf
    const expression = '!isEmpty(plot_id)'

    await addNodeDefExpression({ qualifier, expression: { expression }, expressionText: expression })

    await clickNodeDefSaveAndBack()
  }, 30000)
})
