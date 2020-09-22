import { button, click, toRightOf, writeIntoTextBox, waitFor, clearTextBox } from '../api'

const selectors = {
  name: () => toRightOf('Category name'),
  levelName: ({ levelIndex }) => ({ id: `category-level-name-${levelIndex + 1}` }),
  close: () => button({ class: 'btn-close' }),
}

const selectorsItem = {
  add: ({ levelIndex }) => ({ id: `category-level-${levelIndex}-btn-item-add` }),
  code: ({ levelIndex, itemIndex }) => ({ id: `category-level-${levelIndex}-item-${itemIndex}-code` }),
  label: ({ levelIndex, itemIndex }) => ({ id: `category-level-${levelIndex}-item-${itemIndex}-label-en` }),
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

export const addCategoryItem = async ({ levelIndex, itemIndex, code, label }) => {
  await click(button(selectorsItem.add({ levelIndex })))
  await writeIntoTextBox({ text: code, selector: selectorsItem.code({ levelIndex, itemIndex }) })
  await writeIntoTextBox({ text: label, selector: selectorsItem.label({ levelIndex, itemIndex }) })
}

export const clickCategoryButtonClose = async () => {
  await click(selectors.close())
}
