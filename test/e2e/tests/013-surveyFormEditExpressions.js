import { click } from '../utils/api'
import { editNodeDef } from '../utils/ui/surveyForm'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { addNodeDefDefaultValue, clickNodeDefSaveAndBack, setNodeDefRelevantIf } from '../utils/ui/nodeDefDetail'

describe('SurveyForm edit expressions', () => {
  test('add Default Value to "Cluster decimal"', async () => {
    await clickSidebarBtnSurveyForm()
    await click('Cluster')

    await editNodeDef({ nodeDefLabel: 'Cluster decimal' })
    await addNodeDefDefaultValue({ constant: '0' })

    // TODO assert default value has been set correctly

    await clickNodeDefSaveAndBack()
  })

  test('add "Relevant if" to "Cluster date"', async () => {
    await editNodeDef({ nodeDefLabel: 'Cluster date' })

    await setNodeDefRelevantIf({ expression: `cluster_decimal = '0'` })

    // TODO assert relevant if expression has been set correctly

    await clickNodeDefSaveAndBack()
  })
})
