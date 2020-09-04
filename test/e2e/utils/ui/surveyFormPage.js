import {
  click,
  getElement,
  toRightOf,
  writeIntoTextBox,
  button,
  clearTextBox,
  expectExists,
  hover,
  expectToBe,
} from '../api'
import { waitForLoader } from './loader'
import { expectSurveyFormLoaded } from './surveyForm'

const selectors = {
  name: () => toRightOf('Name'),
  label: () => toRightOf('Label'),
  language: () => toRightOf('Language(s)'),
  multiple: () => toRightOf('Multiple'),
}

export const editPage = async ({ values }) => {
  const { name, label, isMultiple = false } = values

  await clearTextBox({ selector: selectors.name() })
  await writeIntoTextBox({ text: name, selector: selectors.name() })

  await clearTextBox({ selector: selectors.label() })
  await writeIntoTextBox({ text: label, selector: selectors.label() })

  if (isMultiple) {
    await click(await getElement({ selector: '.btn-checkbox' }), selectors.multiple())
  }

  await click('Save')
  await waitForLoader()
  await click('Back')

  await expectSurveyFormLoaded()
}

export const addSubPage = async ({ values }) => {
  await click(button('Sub page'))

  await waitForLoader()
  await editPage({ values })
}

export const expectEmptyPageHasError = async () => {
  await expectExists({ selector: '.survey-form__node-def-error-badge' })
  await hover(await getElement({ selector: '.survey-form__node-def-error-badge' }))
  await expectExists({ text: 'Define at least one child item' })
}

export const expectCurrentPageIs = async ({ label }) => {
  await expectToBe({ selector: '#survey-form-header__label', numberOfItems: 1 })
  const currentPageLabel = await getElement({ selector: '#survey-form-header__label' })
  await expect(await currentPageLabel.text()).toBe(label)
}

const expectPageExists = async ({ pageLabel, pagesElements, pageIndex }) => {
  await expect(await pagesElements[pageIndex].text()).toBe(pageLabel)
}
export const expectFormHasOnlyAndInOrderThesePages = async ({ pageLabels }) => {
  await expectToBe({ selector: '.btn-node-def', numberOfItems: pageLabels.length })
  const pagesOnIndex = await getElement({ selector: '.btn-node-def' })
  const pagesElements = await pagesOnIndex.elements()

  await expect(pagesElements.length).toBe(pageLabels.length)

  await Promise.all([
    pageLabels.map(async (pageLabel, pageIndex) => expectPageExists({ pageLabel, pagesElements, pageIndex })),
  ])
}
