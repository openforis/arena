import { clickSidebarBtnAnalysisProcessingChains } from '../utils/ui/sidebar'
import {
  below,
  click,
  expectExists,
  expectToBe,
  reload,
  textBox,
  toRightOf,
  waitFor,
  writeIntoTextBox,
} from '../utils/api'
import { waitForLoader } from '../utils/ui/loader'
import { addCalculationStep, addProcessingStep } from '../utils/ui/calculationChain'

const chainData = { label: 'Chain 1', description: 'Processing description' }
const calculationData = { label: 'Tree volume' }
const calculationAttributeData = {
  name: 'tree_volume',
  label: 'Tree volume label',
  description: 'Tree volume description',
}

describe('Analysis create chain.', () => {
  test("Chain can't be created until survey is published", async () => {
    await clickSidebarBtnAnalysisProcessingChains()
    await expectExists({ text: 'This section is available only when survey is published' })
  })

  test('Publish survey', async () => {
    await click('Publish')
    await waitForLoader()
    await click('Ok')
    await waitFor(5000)

    await click('Close')
  })

  test('Add new chain', async () => {
    await reload()
    await waitFor(2000)
    await clickSidebarBtnAnalysisProcessingChains()
    await click('New')
    await writeIntoTextBox({ text: chainData.label, selector: toRightOf('Processing chain label') })
    await writeIntoTextBox({ text: chainData.description, selector: toRightOf('Description') })
  })

  test('Add new step', async () => {
    await addProcessingStep()
    await click(textBox(toRightOf('Entity')))
    await click('Tree')
  })

  test('Add new calculation', async () => {
    await addCalculationStep({ label: calculationData.label, attribute: calculationAttributeData })
  }, 30000)

  test('Check values after Add new calculation attribute', async () => {
    await expectExists({ text: chainData.label, selector: toRightOf('Processing chain label') })
    await expectExists({ text: 'Tree', selector: toRightOf('1') })
    await expectExists({ text: 'Tree volume (Tree volume label (C))' })
    await expectExists({ text: 'Tree volume', selector: toRightOf('Labels') })
    await expectExists({ text: 'Tree volume label (C)', selector: toRightOf('Attribute') })
  })

  test('Save calculation', async () => {
    await click('Save')
    await waitForLoader()
    await expectExists({ text: 'Saved!' })
  })

  test('Expect exists chain in chains list', async () => {
    await clickSidebarBtnAnalysisProcessingChains()
    await expectExists({ text: 'Processing chain', selector: below('Label') })
  })

  test('Chain reload', async () => {
    // reload page
    await reload()
    await waitFor(2000)

    // select chain
    await click(chainData.label)

    await expectExists({ text: chainData.label, selector: toRightOf('Processing chain label') })
    await expectExists({ text: 'Tree', selector: toRightOf('1') })
    await expectToBe({ selector: '.chain-list-item', numberOfItems: 1 })

    await clickSidebarBtnAnalysisProcessingChains()
  })
})
