import { button, clearTextBox, click, getElement, toRightOf, writeIntoTextBox } from '../api'

const selectors = {
  name: () => toRightOf('Category name'),
  levelName: ({ levelIndex }) => ({ id: `category-level-${levelIndex}-name` }),
  close: () => button({ class: 'btn-close' }),
  done: () => button('Done'),
}

const _itemId = ({ levelIndex, itemIndex }) => `category-level-${levelIndex}-item-${itemIndex}`

const selectorsItem = {
  add: ({ levelIndex }) => ({ id: `category-level-${levelIndex}-btn-item-add` }),
  item: ({ levelIndex, itemIndex }) => `#${_itemId({ levelIndex, itemIndex })}`,
  itemBtnClose: ({ levelIndex, itemIndex }) => `#${_itemId({ levelIndex, itemIndex })}-btn-close`,
  code: ({ levelIndex, itemIndex }) => ({ id: `${_itemId({ levelIndex, itemIndex })}-code` }),
  label: ({ levelIndex, itemIndex }) => ({ id: `${_itemId({ levelIndex, itemIndex })}-label-en` }),
}

export const writeCategoryName = async (text) => {
  await writeIntoTextBox({ text, selector: selectors.name() })
}

export const updateCategoryLevelName = async ({ levelIndex, name }) => {
  await clearTextBox({ selector: selectors.levelName({ levelIndex }) })
  // await waitForCategoryValidation()
  await writeIntoTextBox({ text: name, selector: selectors.levelName({ levelIndex }) })
  // await waitForCategoryValidation()
}

export const addCategoryLevel = async ({ levelIndex, name }) => {
  await click('Add level')
  // await waitForCategoryValidation()
  await updateCategoryLevelName({ levelIndex, name })
}

export const addCategoryItem = async ({ levelIndex, itemIndex, code, label }) => {
  await click(button(selectorsItem.add({ levelIndex })))
  await writeIntoTextBox({ text: code, selector: selectorsItem.code({ levelIndex, itemIndex }) })
  await writeIntoTextBox({ text: label, selector: selectorsItem.label({ levelIndex, itemIndex }) })
}

export const clickCategoryItem = async ({ levelIndex, itemIndex }) =>
  click(await getElement({ selector: selectorsItem.item({ levelIndex, itemIndex }) }))

export const clickCategoryItemBtnClose = async ({ levelIndex, itemIndex }) =>
  click(await getElement({ selector: selectorsItem.itemBtnClose({ levelIndex, itemIndex }) }))

export const clickCategoryButtonClose = async () => click(selectors.close())

export const clickCategoryButtonDone = async () => click(selectors.done())
