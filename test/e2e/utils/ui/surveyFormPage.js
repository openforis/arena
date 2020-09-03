import { click, getElement, toRightOf, writeIntoTextBox, button, clearTextBox } from '../api'
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
