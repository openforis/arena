import { click } from '../utils/api'
import { editNodeDef } from '../utils/ui/surveyForm'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { clickNodeDefSaveAndBack } from '../utils/ui/nodeDefDetail'
import {
  addNodeDefDefaultValue,
  expectNodeDefDefaultValue,
  expectNodeDefRelevantIf,
  setNodeDefRelevantIf,
  setNodeDefDefaultValueApplyIf,
  expectNodeDefDefaultValueApplyIfIf,
  addNodeDefBooleanDefaultValue,
} from '../utils/ui/nodeDefDetailsAdvanced'

describe('SurveyForm edit expressions', () => {
  test('open surveyForm Cluster', async () => {
    await clickSidebarBtnSurveyForm()
    await click('Cluster')
  })

  test('add Default Value to "Cluster decimal"', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster decimal' })
    await addNodeDefDefaultValue({ constant: '0' })

    await expectNodeDefDefaultValue({ expression: '0' })

    await clickNodeDefSaveAndBack()
  })

  test('add "Relevant if" to "Cluster date"', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster date' })

    const expression = `cluster_decimal > '0'`

    await setNodeDefRelevantIf({ expression })
    await expectNodeDefRelevantIf({ expression })

    await clickNodeDefSaveAndBack()
  })

  test('add Default Value to "cluster_boolean" as "true" if "cluster_decimal" value is > 5', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster boolean' })

    await addNodeDefBooleanDefaultValue({ defaultValue: 'True' })
    const expression = 'true'
    await expectNodeDefDefaultValue({ expression })

    const applyIf = `cluster_decimal > '5'`

    await setNodeDefDefaultValueApplyIf({ expression, applyIf })
    await expectNodeDefDefaultValueApplyIfIf({ expression, applyIf })

    await clickNodeDefSaveAndBack()
  })
})
