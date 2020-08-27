import { button, click, expectExists, expectExistsExactlyNumberOfTimes, waitFor1sec } from '../utils/api'
import { clickSidebarBtnSurveyForm } from '../utils/ui'

const verifySurveyFormLoaded = async () => {
  await expectExists({ selector: '.survey-form' })
}

const verifyHasOnluRootEntity = async () => {
  await expectExistsExactlyNumberOfTimes({ selector: '.btn-node-def', numberOfItems: 1 })
  await expectExistsExactlyNumberOfTimes({ itemSelector: button('root_entity'), numberOfItems: 1 })
}

describe('SurveyForm edit cluster', () => {
  test('SurveyForm cluster', async () => {
    await clickSidebarBtnSurveyForm()

    await verifySurveyFormLoaded()

    await verifyHasOnluRootEntity()
  })

  test('Publish root_entity error', async () => {
    await waitFor1sec()
    await click('Publish')
    await waitFor1sec()
    await click('OK')
    await expectExists({ text: 'Define at least one key attribute' })
    await expectExists({ text: 'Define at least one child item' })
    await click('Close')
  })
})
