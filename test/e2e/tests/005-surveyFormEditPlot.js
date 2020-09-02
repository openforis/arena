import { click, expectExists, getElement, toRightOf, writeIntoTextBox, button } from '../utils/api'
import { waitForLoader } from '../utils/ui'

const expectSurveyFormLoaded = async () => expectExists({ selector: '.survey-form' })

const getElementRightOfLabel = ({ label }) => toRightOf(label)

const selectors = {
  name: () => getElementRightOfLabel({ label: 'Name' }),
  label: () => getElementRightOfLabel({ label: 'Label' }),
  language: () => getElementRightOfLabel({ label: 'Language(s)' }),
  multiple: () => getElementRightOfLabel({ label: 'Multiple' }),
}

const addPage = async () => {
  await click(button('Sub page'))

  await waitForLoader()

  await writeIntoTextBox({ text: 'Name', selector: selectors.name() })
  await writeIntoTextBox({ text: 'Plot', selector: selectors.label() })
  await click(await getElement({ selector: '.btn-checkbox' }), selectors.multiple())

  await click('Save')
  await waitForLoader()
  await click('Back')
  await waitForLoader()
  await expectSurveyFormLoaded()
}

describe('SurveyForm edit Plot', () => {
  test('Plot create', async () => {
    await addPage()
  })
})
