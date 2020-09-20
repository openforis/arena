import { below, button, click, toRightOf, writeIntoTextBox } from '../api'

const selectoBelowLevel = ({ levelIndex }) => below(`Level ${levelIndex + 1}`)

const selectors = {
  name: () => toRightOf('Category name'),
  levelName: ({ levelIndex }) => [selectoBelowLevel({ levelIndex }), toRightOf('Name')],
  close: () => button({ class: 'btn-close' }),
}

const selectorsItem = {
  add: ({ levelIndex }) => button(selectoBelowLevel({ levelIndex }), { class: 'btn-add-item' }),
  code: ({ levelIndex }) => [selectoBelowLevel({ levelIndex }), toRightOf('Code')],
  label: ({ levelIndex }) => [selectoBelowLevel({ levelIndex }), toRightOf('Label')],
}

export const writeCategoryName = async (text) => {
  await writeIntoTextBox({ text, selector: selectors.name() })
}

export const addCategoryLevel = async ({ levelIndex, name }) => {
  await click('Add level')
  await writeIntoTextBox({ text: name, selector: selectors.levelName({ levelIndex }) })
}

export const addCategoryItem = async ({ levelIndex, code, label }) => {
  await click(selectorsItem.add({ levelIndex }))
  await writeIntoTextBox({ text: code, selector: selectorsItem.code({ levelIndex }) })
  await writeIntoTextBox({ text: label, selector: selectorsItem.label({ levelIndex }) })
}

export const clickCategoryButtonClose = async () => {
  await click(selectors.close())
}
