import { click, waitFor1sec } from '../utils/api'
import { editNodeDef } from '../utils/ui/surveyForm'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { clickNodeDefSaveAndBack, expectNodeDefUnchanged } from '../utils/ui/nodeDefDetail'
import {
  addNodeDefDefaultValue,
  expectNodeDefDefaultValue,
  expectNodeDefRelevantIf,
  setNodeDefRelevantIf,
  setNodeDefDefaultValueApplyIf,
  expectNodeDefDefaultValueApplyIf,
  addNodeDefBooleanDefaultValue,
  deleteNodeDefDefaultValue,
  expectNodeDefDefaultValuesInvalid,
  expectNodeDefDefaultValuesValid,
  addNodeDefValidation,
  deleteNodeDefValidation,
  expectNodeDefValidation,
  setNodeDefValidationApplyIf,
  expectNodeDefValidationApplyIf,
  expectNodeDefValidtionExpressionsCount,
} from '../utils/ui/nodeDefDetailsAdvanced'

describe('SurveyForm edit expressions', () => {
  test('open surveyForm Cluster', async () => {
    await clickSidebarBtnSurveyForm()
    await click('Cluster')
  })

  test('add Default Value "0" to "Cluster decimal"', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster decimal' })
    await addNodeDefDefaultValue({ constant: '0' })

    await expectNodeDefDefaultValue({ expression: '0' })

    await expectNodeDefDefaultValuesValid()
  })

  test('add another Default Value to "cluster_decimal" without Apply If (error)', async () => {
    await addNodeDefDefaultValue({ constant: '1' })

    await expectNodeDefDefaultValuesInvalid()

    // delete the first default value
    await deleteNodeDefDefaultValue()
    // expect the "new" default value to be the first one
    await expectNodeDefDefaultValue({ expression: '1' })

    await expectNodeDefDefaultValuesValid()

    await clickNodeDefSaveAndBack()
  }, 60000)

  test('add "Relevant if cluster_decimal > 0" to "Cluster date"', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster date' })

    await setNodeDefRelevantIf({
      binaryExpression: { left: { identifier: 'cluster_decimal' }, operator: '>', right: { constant: '0' } },
    })
    await expectNodeDefRelevantIf({ expression: `cluster_decimal > 0` })

    await clickNodeDefSaveAndBack()
  }, 60000)

  test('add Default Value to "cluster_boolean" as "true" if "cluster_decimal" value is > 5, "false" otherwise', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster boolean' })
    await waitFor1sec()

    await click('Advanced')

    await addNodeDefBooleanDefaultValue({ defaultValue: 'True' })
    await waitFor1sec()
    await expectNodeDefDefaultValue({ expression: `"true"` })

    const applyIf = `cluster_decimal > '5'`
    await setNodeDefDefaultValueApplyIf({ expression: applyIf })
    await expectNodeDefDefaultValueApplyIf({ expression: applyIf })

    await addNodeDefBooleanDefaultValue({ defaultValue: 'False' })
    await waitFor1sec()
    await expectNodeDefDefaultValue({ index: 1, expression: `"false"` })

    await clickNodeDefSaveAndBack()
    await waitFor1sec()
  }, 60000)

  // Validations

  test('add Validation to "cluster_decimal": cluster_decimal < 10 if cluster_id = 1', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster decimal' })

    await click('Validations')

    // expect to have only expression placeholder
    await expectNodeDefValidtionExpressionsCount({ count: 1 })

    await addNodeDefValidation({
      binaryExpression: { left: { identifier: 'cluster_decimal' }, operator: '<', right: { constant: '10' } },
    })

    await expectNodeDefValidation({ expression: 'cluster_decimal < 10' })

    await setNodeDefValidationApplyIf({
      binaryExpression: { left: { identifier: 'cluster_id' }, operator: '=', right: { constant: '1' } },
    })
    await expectNodeDefValidationApplyIf({ expression: 'cluster_id == 1' })

    await expectNodeDefValidtionExpressionsCount({ count: 2 })

    await clickNodeDefSaveAndBack()
  }, 60000)

  test('add Validation and delete it: no changes applied', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster decimal' })

    await click('Validations')

    // check previously defined validation
    await expectNodeDefValidtionExpressionsCount({ count: 2 })
    await expectNodeDefValidation({ expression: 'cluster_decimal < 10' })

    const binaryExpression = { left: { identifier: 'cluster_decimal' }, operator: '<', right: { constant: '20' } }

    // add validation and delete it: no changes applied to the node def (save button disabled)
    await addNodeDefValidation({ binaryExpression })

    await expectNodeDefValidtionExpressionsCount({ count: 3 })

    await deleteNodeDefValidation({ index: 1 })

    await expectNodeDefValidtionExpressionsCount({ count: 2 })

    await expectNodeDefUnchanged()
  })

  test('add Validation to "cluster_decimal": cluster_decimal < 20 if cluster_id = 2', async () => {
    await addNodeDefValidation({
      binaryExpression: { left: { identifier: 'cluster_decimal' }, operator: '<', right: { constant: '20' } },
    })

    await expectNodeDefValidtionExpressionsCount({ count: 3 })

    await expectNodeDefValidation({ expression: 'cluster_decimal < 20', index: 1 })

    await setNodeDefValidationApplyIf({
      binaryExpression: { left: { identifier: 'cluster_id' }, operator: '=', right: { constant: '2' } },
      index: 1,
    })
    await expectNodeDefValidationApplyIf({ expression: 'cluster_id == 2', index: 1 })

    await clickNodeDefSaveAndBack()
  }, 60000)

  test('add Validation to "cluster_decimal": cluster_decimal < cluster_id*10 if cluster_id > 20', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster decimal' })

    await click('Validations')

    const expression = 'cluster_decimal < cluster_id * 10'

    await addNodeDefValidation({ expression })

    await expectNodeDefValidation({ expression, index: 2 })

    const applyIfExpression = 'cluster_id > 20'
    await setNodeDefValidationApplyIf({ expression: applyIfExpression, index: 2 })
    await expectNodeDefValidationApplyIf({ expression: applyIfExpression, index: 2 })

    await clickNodeDefSaveAndBack()
  }, 60000)
})
