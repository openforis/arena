import { waitForLoader } from './loader'
import { clickHeaderBtnMySurveys } from './header'
import { click, clickParent, getElement, writeIntoTextBox } from '../api'

export const deleteSurvey = async ({ name, label, needsToFind = true }) => {
  if (needsToFind) {
    await waitForLoader()
    await clickHeaderBtnMySurveys()
    await clickParent(label)
    await waitForLoader()
  }

  await click('Delete')

  await waitForLoader()
  await writeIntoTextBox({ text: name, selector: { class: 'confirm-name' } })
  await click(await getElement({ selector: '.btn-danger' }))

  await waitForLoader()
}
