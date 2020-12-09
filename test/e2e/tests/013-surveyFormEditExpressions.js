import { click } from '../utils/api'
import { editNodeDef } from '../utils/ui/surveyForm'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { clickNodeDefSaveAndBack } from '../utils/ui/nodeDefDetail'
import {
  addNodeDefDefaultValue,
  expectNodeDefDefaultValue,
  expectNodeDefRelevantIf,
  setNodeDefRelevantIf,
} from '../utils/ui/nodeDefDetailsAdvanced'

describe('SurveyForm edit expressions', () => {
  test('add Default Value to "Cluster decimal"', async () => {
    await clickSidebarBtnSurveyForm()
    await click('Cluster')

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
})
