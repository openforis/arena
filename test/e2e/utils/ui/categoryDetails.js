import { below, button, click, toRightOf, writeIntoTextBox, waitFor, clearTextBox } from '../api'

const belowLevel = ({ levelIndex }) => below(`Level ${levelIndex + 1}`)

const selectors = {
  name: () => toRightOf('Category name'),
  levelName: ({ levelIndex }) => ({ id: `category-level-name-${levelIndex + 1}` }),
  close: () => button({ class: 'btn-close' }),
}

const selectorsItem = {
  add: ({ levelIndex }) => button(belowLevel({ levelIndex }), { class: 'btn-add-item' }),
  code: ({ levelIndex }) => [belowLevel({ levelIndex }), toRightOf('Code')],
  label: ({ levelIndex }) => [belowLevel({ levelIndex }), toRightOf('Label')],
}

export const writeCategoryName = async (text) => {
  await writeIntoTextBox({ text, selector: selectors.name() })
}

const waitForCategoryValidation = async () => waitFor(500)

export const updateCategoryLevelName = async ({ levelIndex, name }) => {
  await clearTextBox({ selector: selectors.levelName({ levelIndex }) })
  await waitForCategoryValidation()
  await writeIntoTextBox({ text: name, selector: selectors.levelName({ levelIndex }) })
  await waitForCategoryValidation()
}

export const addCategoryLevel = async ({ levelIndex, name }) => {
  await click('Add level')
  await waitForCategoryValidation()
  await updateCategoryLevelName({ levelIndex, name })
}

export const addCategoryItem = async ({ levelIndex, code, label }) => {
  await click(selectorsItem.add({ levelIndex }))
  await writeIntoTextBox({ text: code, selector: selectorsItem.code({ levelIndex }) })
  await writeIntoTextBox({ text: label, selector: selectorsItem.label({ levelIndex }) })
}

export const clickCategoryButtonClose = async () => {
  await click(selectors.close())
}
