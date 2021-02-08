import {
  $,
  clearTextBox,
  click,
  expectExists,
  getElement,
  writeIntoTextBox,
  toRightOf,
  button,
  textBox,
  above,
} from '../api'
import { waitForLoader } from './loader'

const elements = {
  stepAddBtn: () => $('.btn-add-step'),
  stepCategory: () => textBox(toRightOf('Category')),
  calculationCloseBtn: () => $('.btn-close-calculation'),
  stepCloseBtn: () => $('.btn-close-step'),
}

export const addProcessingStep = async () => click(elements.stepAddBtn())

export const addCalculationStep = async ({ label, attribute }) => {
  await click(button(getElement({ selector: '.icon-plus' })), toRightOf('Calculation steps'))
  await clearTextBox({ selector: toRightOf('Labels') })
  await writeIntoTextBox({ text: label, selector: above('Quantitative') })

  if (attribute) {
    await click('Add', toRightOf('Attribute'))

    await expectExists({ text: 'DECIMAL' })
    await expectExists({ selector: '.icon-checkbox-checked', relativeSelectors: [toRightOf('Analysis')] })

    await writeIntoTextBox({ text: attribute.name, selector: toRightOf('Name') })

    if (attribute.label) {
      await writeIntoTextBox({ text: attribute.label, selector: toRightOf('Labels') })
    }
    if (attribute.description) {
      await writeIntoTextBox({ text: attribute.description, selector: toRightOf('Descriptions') })
    }

    await click('Save')
    await waitForLoader()
    await click('Back')
  }
}
