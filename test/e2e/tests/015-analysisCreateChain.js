import { clickSidebarBtnAnalysisProcessingChains } from '../utils/ui/sidebar'
import { click, expectExists, expectToBe, reload, toRightOf, waitFor, writeIntoTextBox } from '../utils/api'
import {
  addCalculationStep,
  addCalculationAttribute,
  addProcessingStep,
  closeCalculation,
  closeStep,
  deleteItem,
  expectStepAddButtonDisabled,
  expectStepCategorySelectorNotExists,
  publishSurvey,
  save,
} from '../utils/ui/calculationChain'

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
    await publishSurvey()
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
    await addProcessingStep({ entity: 'Tree' })
  })

  test('Add new calculation', async () => {
    await addCalculationStep({ label: calculationData.label })
    await addCalculationAttribute({ attribute: calculationAttributeData })
  }, 30000)

  test('Check values after Add new calculation attribute', async () => {
    await expectExists({ text: chainData.label, selector: toRightOf('Processing chain label') })
    await expectExists({ text: 'Tree', selector: toRightOf('1') })
    await expectExists({ text: 'Tree volume (Tree volume label (C))' })
    await expectExists({ text: 'Tree volume', selector: toRightOf('Labels') })
    await expectExists({ text: 'Tree volume label (C)', selector: toRightOf('Attribute') })
  })

  test('Save calculation', async () => {
    await save()
  })

  test('Add new step (with category)', async () => {
    await closeCalculation()
    await closeStep()

    await addProcessingStep({ category: 'administrative_unit' })

    await save()
  }, 30000)

  test('Expect cannot add new processing steps', async () => {
    await closeStep()

    await expectStepAddButtonDisabled()

    await click('Tree')
    await expectStepCategorySelectorNotExists()

    await closeStep()
  }, 30000)

  test('Delete processing step', async () => {
    await expectToBe({ selector: '.chain-list-item', numberOfItems: 2 })

    await click('administrative_unit')

    await deleteItem()

    await expectToBe({ selector: '.chain-list-item', numberOfItems: 1 })
  })

  test('Expect exists chain in chains list', async () => {
    await clickSidebarBtnAnalysisProcessingChains()
    await expectExists({ text: chainData.label })

    await publishSurvey()
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
