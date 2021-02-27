import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'

import { gotoHome, gotoChains } from './_navigation'

const newChainBtn = getSelector(DataTestId.chainsList.newBtn, 'a')
const surveyLabel = getSelector(DataTestId.chainsList.chainLabel(), 'input')
const surveyDescription = getSelector(DataTestId.chainsList.chainDescription(), 'input')

const addStepBtn = getSelector(DataTestId.chainsList.addStep, 'button')

const addNewChain = () =>
  test('Add new chain', async () => {
    await page.reload()
    await page.click(newChainBtn)

    await page.fill(surveyLabel, 'Chain name')
    await page.fill(surveyDescription, 'Chain description')
    await page.click(addStepBtn)
  })

export default () =>
  describe('Chain edit', () => {
    gotoChains()
    addNewChain()

    gotoHome()
  })
