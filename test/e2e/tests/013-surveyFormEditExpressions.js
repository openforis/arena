import { click, waitFor1sec } from '../utils/api'
import { editNodeDef } from '../utils/ui/surveyForm'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { clickNodeDefSaveAndBack } from '../utils/ui/nodeDefDetail'
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

  test('add another Default Value to "cluster_boolean" without Apply If (error)', async () => {
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

  test('add Default Value to "cluster_boolean" as "true" if "cluster_decimal" value is > 5', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster boolean' })
    await waitFor1sec()

    await click('Advanced')

    await addNodeDefBooleanDefaultValue({ defaultValue: 'True' })
    await waitFor1sec()

    await expectNodeDefDefaultValue({ expression: `"true"` })

    const applyIf = `cluster_decimal > '5'`
    await setNodeDefDefaultValueApplyIf({ expression: applyIf })
    await expectNodeDefDefaultValueApplyIf({ expression: applyIf })
  }, 60000)

  test('add Default Value to "cluster_boolean" as "false" otherwise', async () => {
    await addNodeDefBooleanDefaultValue({ defaultValue: 'False' })
    await waitFor1sec()
    await expectNodeDefDefaultValue({ index: 1, expression: `"false"` })

    await clickNodeDefSaveAndBack()
    await waitFor1sec()
  }, 60000)
})
