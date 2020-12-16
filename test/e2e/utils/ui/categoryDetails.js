import {
  button,
  clearTextBox,
  click,
  expectExists,
  expectNotExists,
  expectToBe,
  getElement,
  toRightOf,
  waitFor1sec,
  writeIntoTextBox,
  waitFor,
  expectInputTextToBe,
  expectInputTextExists,
} from '../api'

const selectors = {
  name: () => toRightOf('Category name'),
  levelName: ({ levelIndex }) => ({ id: `category-level-${levelIndex}-name` }),
  itemAdd: ({ levelIndex }) => ({ id: `category-level-${levelIndex}-btn-item-add` }),
  itemsInLevel: ({ levelIndex }) => `#category-level-${levelIndex} .category__item`,
  close: () => button({ class: 'btn-close' }),
  done: () => button('Done'),
}
const _itemId = ({ levelIndex, itemIndex }) => `category-level-${levelIndex}-item-${itemIndex}`

const selectorsItem = {
  item: ({ levelIndex, itemIndex }) => `#${_itemId({ levelIndex, itemIndex })}`,
  codeId: ({ levelIndex, itemIndex }) => `#${_itemId({ levelIndex, itemIndex })}-code`,
  code: ({ levelIndex, itemIndex }) => ({ id: `${_itemId({ levelIndex, itemIndex })}-code` }),
  labelId: ({ levelIndex, itemIndex }) => `#${_itemId({ levelIndex, itemIndex })}-label-en`,
  label: ({ levelIndex, itemIndex }) => ({ id: `${_itemId({ levelIndex, itemIndex })}-label-en` }),
  itemBtnClose: ({ levelIndex, itemIndex }) => `#${_itemId({ levelIndex, itemIndex })}-btn-close`,
}

const waitForCategoryValidation = async () => waitFor1sec()

export const writeCategoryName = async (text) => {
  await writeIntoTextBox({ text, selector: selectors.name() })
  await waitForCategoryValidation()
}

export const updateCategoryLevelName = async ({ levelIndex, name }) => {
  await expectInputTextExists({ selector: selectors.levelName({ levelIndex }) })
  await clearTextBox({ selector: selectors.levelName({ levelIndex }) })
  await waitFor(200)
  await writeIntoTextBox({ text: name, selector: selectors.levelName({ levelIndex }) })
}

export const addCategoryLevel = async ({ levelIndex, name }) => {
  await click('Add level')
  await waitFor(200)
  await updateCategoryLevelName({ levelIndex, name })
}

export const addCategoryItem = async ({ levelIndex, itemIndex, code, label }) => {
  await click(button(selectors.itemAdd({ levelIndex })))
  await waitFor(200)

  await expectExists({ selector: selectorsItem.codeId({ levelIndex, itemIndex }) })
  await expectInputTextToBe({ text: '', selector: selectorsItem.code({ levelIndex, itemIndex }) })
  await writeIntoTextBox({ text: String(code), selector: selectorsItem.code({ levelIndex, itemIndex }) })
  await waitFor(200)

  await expectInputTextToBe({ text: String(code), selector: selectorsItem.code({ levelIndex, itemIndex }) })

  await waitFor(200)

  await expectExists({ selector: selectorsItem.labelId({ levelIndex, itemIndex }) })
  await expectInputTextToBe({ text: '', selector: selectorsItem.label({ levelIndex, itemIndex }) })
  await writeIntoTextBox({ text: label, selector: selectorsItem.label({ levelIndex, itemIndex }) })
  await expectInputTextToBe({ text: String(label), selector: selectorsItem.label({ levelIndex, itemIndex }) })
}

export const clickCategoryItem = async ({ levelIndex, itemIndex }) =>
  click(await getElement({ selector: selectorsItem.item({ levelIndex, itemIndex }) }))

export const clickCategoryItemBtnClose = async ({ levelIndex, itemIndex }) =>
  click(await getElement({ selector: selectorsItem.itemBtnClose({ levelIndex, itemIndex }) }))

export const clickCategoryButtonClose = async () => click(selectors.close())

export const clickCategoryButtonDone = async () => click(selectors.done())

export const expectCategoryItemsInLevel = async ({ levelIndex, numberOfItems }) =>
  expectToBe({ selector: selectors.itemsInLevel({ levelIndex }), numberOfItems })

export const expectCategoryItemsInLevelEmpty = async ({ levelIndex }) =>
  expectNotExists({ selector: selectors.itemsInLevel({ levelIndex }) })
