import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'

import { gotoHome, gotoChains } from './_navigation'
import { editNodeDefDetails } from './_nodeDefDetails'
import { treeVolume } from '../mock/chains'

const newChainBtn = getSelector(DataTestId.chainsList.newBtn, 'a')
const chainLabel = getSelector(DataTestId.chainsList.chainLabel(), 'input')
const chainDescription = getSelector(DataTestId.chainsList.chainDescription(), 'input')

const addStepBtn = getSelector(DataTestId.chainsList.addStep, 'button')

const entitySelectorToggleButton = getSelector(
  DataTestId.dropdown.toggleBtn(DataTestId.chainsList.step.entitySelector),
  'button'
)

const addCalculationBtn = getSelector(DataTestId.chainsList.step.addCalculation, 'button')
const calculationLabel = getSelector(DataTestId.chainsList.calculation.calculationLabel(), 'input')
const addCalculationAttributeBtn = getSelector(DataTestId.chainsList.calculation.addAttribute, 'button')

const addNewChain = () =>
  test('Add new chain', async () => {
    await page.reload()
    await page.click(newChainBtn)

    await page.fill(chainLabel, 'Chain name')
    await page.fill(chainDescription, 'Chain description')

    // Add new step
    await page.click(addStepBtn)
    await page.click(entitySelectorToggleButton)
    const entityEl = await page.waitForSelector(`text="Tree"`)
    await entityEl.click()

    // Add new calculation
    await page.click(addCalculationBtn)
    await page.fill(calculationLabel, 'Tree volume label')
    await page.click(addCalculationAttributeBtn)
  })

const postAddAttribute = async () => {
  await page.reload()
}

export default () =>
  describe('Chain edit', () => {
    gotoChains()
    addNewChain()
    editNodeDefDetails(treeVolume, postAddAttribute)
    gotoHome()
  })
