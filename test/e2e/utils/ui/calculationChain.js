import {
  $,
  above,
  button,
  clearTextBox,
  click,
  expectExists,
  expectNotExists,
  getElement,
  textBox,
  toRightOf,
  waitFor,
  waitFor1sec,
  writeIntoTextBox,
} from '../api'
import { waitForLoader } from './loader'

const selectors = {
  categorySelector: '.category-selector',
}

const elements = {
  stepAddBtn: () => $('.btn-add-step'),
  stepCategory: () => textBox(toRightOf('Category')),
  calculationCloseBtn: () => $('.btn-close-calculation'),
  stepCloseBtn: () => $('.btn-close-step'),
}

export const publishSurvey = async () => {
  await click('Publish')
  await waitForLoader()
  await click('Ok')
  await waitFor(5000)
  await click('Close')
}

export const save = async () => {
  await click('Save')
  await waitForLoader()
  await expectExists({ text: 'Saved!' })
}

const selectProcessingStepCategory = async ({ name }) => {
  await click(elements.stepCategory())
  await click(name)
}

export const addProcessingStep = async ({ entity, category }) => {
  await click(elements.stepAddBtn())
  if (entity) {
    await click(textBox(toRightOf('Entity')))
    await click(entity)
  }
  if (category) {
    await selectProcessingStepCategory({ name: category })
  }
}

export const addCalculationStep = async ({ label }) => {
  await click(button(getElement({ selector: '.icon-plus' })), toRightOf('Calculation steps'))
  await clearTextBox({ selector: toRightOf('Labels') })
  await writeIntoTextBox({ text: label, selector: above('Quantitative') })
}

export const addCalculationAttribute = async ({ attribute }) => {
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

export const closeStep = async () => click(elements.stepCloseBtn())

export const closeCalculation = async () => click(elements.calculationCloseBtn())

export const deleteItem = async () => {
  await click('Delete')
  await waitFor1sec()
  await click('Ok')
}

export const expectStepAddButtonDisabled = async () => {
  const disabled = await elements.stepAddBtn().isDisabled()
  await expect(disabled).toBeTruthy()
}

export const expectStepCategorySelectorNotExists = async () => expectNotExists({ selector: selectors.categorySelector })
