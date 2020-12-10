import { clickSidebarBtnAnalysisProcessingChains, clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import {
  clearTextBox,
  click,
  expectExists,
  getElement,
  writeIntoTextBox,
  toRightOf,
  button,
  textBox,
  above,
  below,
  waitFor,
} from '../utils/api'
import { waitForLoader } from '../utils/ui/loader'

describe('Analysis create chain.', () => {
  test("Chain can't be created until survey is published", async () => {
    await clickSidebarBtnAnalysisProcessingChains()
    await expectExists({ text: 'This section is available only when survey is published' })
  })

  test('Publish chain', async () => {
    await click('Publish')
    await waitForLoader()
    await click('Ok')
    await waitFor('close')
    await click('close')
  })

  test('Add new chain', async () => {
    await waitForLoader()
    await click('New')
    await clearTextBox({ selector: toRightOf('Processing chain label') })
    await writeIntoTextBox({ text: 'Chain 1', selector: toRightOf('Processing chain label') })
    await clearTextBox({ selector: toRightOf('Description') })
    await writeIntoTextBox({ text: 'Processing description', selector: toRightOf('Description') })
  })

  test('Add new step', async () => {
    await click(button(getElement({ selector: '.icon-plus' })), toRightOf('Processing steps'))
    await click(textBox(toRightOf('Entity')))
    await click('Tree')
  })

  test('Add new calculation', async () => {
    await click(button(getElement({ selector: '.icon-plus' })), toRightOf('Calculation steps'))
    await clearTextBox({ selector: toRightOf('Labels') })
    await writeIntoTextBox({ text: 'Tree volume', selector: above('Quantitative') })
  })

  test('Add new calculation attribute', async () => {
    await click('Add', toRightOf('Attribute'))

    await clearTextBox({ selector: toRightOf('Name') })
    await writeIntoTextBox({ text: 'tree_volume', selector: toRightOf('Name') })
    await expectExists({ text: 'DECIMAL' })
    await expectExists({ selector: '.icon-checkbox-checked', relativeSelectors: [toRightOf('Analysis')] })

    await clearTextBox({ selector: toRightOf('Labels') })
    await writeIntoTextBox({ text: 'Tree volume', selector: toRightOf('Labels') })

    await clearTextBox({ selector: toRightOf('Descriptions') })
    await writeIntoTextBox({ text: 'Tree volume description', selector: toRightOf('Descriptions') })

    await click('Save')
    await waitForLoader()
    await click('Back')
  })

  test('Check values after Add new calculation attribute', async () => {
    await expectExists({ text: 'Chain 1', selector: toRightOf('Processing chain label') })
    await expectExists({ text: 'Tree', selector: toRightOf('1') })
    await expectExists({ text: 'Tree volume (Tree volume (C))' })
    await expectExists({ text: 'Tree volume', selector: toRightOf('Labels') })
    await expectExists({ text: 'Tree volume (C)', selector: toRightOf('Attribute') })
  })

  test('Save calculation', async () => {
    await click('Save')
    await waitForLoader()
    await expectExists({ text: 'Saved!' })
    await clickSidebarBtnAnalysisProcessingChains()
    await expectExists({ text: 'Processing chain', selector: below('Label') })
  })
})
