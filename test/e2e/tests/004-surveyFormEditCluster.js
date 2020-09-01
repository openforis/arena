import { click, expectExists, getElement, clearTextBox, toRightOf, writeIntoTextBox } from '../utils/api'
import { clickSidebarBtnSurveyForm, waitForLoader } from '../utils/ui'

const expectSurveyFormLoaded = async () => expectExists({ selector: '.survey-form' })

const expectHasOnlyRootEntity = async ({ rootEntityName }) => {
  await expectExists({ selector: '.btn-node-def', numberOfItems: 1 })
  const sel = `//button[text()='${rootEntityName}']`
  await expectExists({ selector: sel, numberOfItems: 1 })
}

const addClusterItem = async ({ type, name, label, isKey }) => {
  const pencilIcon = await getElement({ selector: '.icon-pencil2' })
  await click(await getElement({ selector: '.icon-plus' }), toRightOf(pencilIcon))

  await click(type)

  await writeIntoTextBox({ text: name, selector: toRightOf('Name') })
  await writeIntoTextBox({ text: label, selector: toRightOf('Label') })
  if (isKey) {
    await click(await getElement({ selector: '.btn-checkbox' }), toRightOf('Key'))
  }
  await click('Save')
  await waitForLoader()
  await click('Back')
  await waitForLoader()
}

const nodeDefItems = [
  { type: 'integer', name: 'cluster_id', label: 'Cluster id', isKey: true },
  { type: 'decimal', name: 'cluster_decimal', label: 'Cluster decimal', isKey: false },
  { type: 'date', name: 'cluster_date', label: 'Cluster date', isKey: false },
  { type: 'time', name: 'cluster_time', label: 'Cluster Time', isKey: false },
  { type: 'boolean', name: 'cluster_boolean', label: 'Cluster boolean', isKey: false },
  { type: 'coordinate', name: 'cluster_coordinate', label: 'Cluster coordinate', isKey: false },
]
const expectNodeDefInOrder = async ({ items: children }) => {
  const elements = await getElement({ selector: '.survey-form__node-def-page-item' })

  const items = await elements.elements()

  await expect(items.length).toBe(nodeDefItems.length)

  await items.map(async (item, index) => {
    const itemText = await item.text()
    await expect(itemText.split('\n')[0]).toBe(children[index].label.toUpperCase())
  })
}

describe('SurveyForm edit cluster', () => {
  test('SurveyForm cluster', async () => {
    await clickSidebarBtnSurveyForm()

    await expectSurveyFormLoaded()

    await expectExists({ selector: `//button[text()='root_entity']` })

    await expectHasOnlyRootEntity({ rootEntityName: 'root_entity' })
  })

  test('Publish root_entity error', async () => {
    await click('Publish')
    await waitForLoader()
    await click('OK')
    await expectExists({ text: 'Define at least one key attribute' })
    await expectExists({ text: 'Define at least one child item' })
    await click('Close')
  })

  test('root_entity rename', async () => {
    await click(await getElement({ selector: '.icon-pencil2' }))

    await clearTextBox({ selector: toRightOf('Name') })
    await writeIntoTextBox({ text: 'cluster', selector: toRightOf('Name') })

    await clearTextBox({ selector: toRightOf('Labels') })
    await writeIntoTextBox({ text: 'Cluster', selector: toRightOf('Labels') })

    await click('Save')
    await waitForLoader()
    await click('Back')

    await expectSurveyFormLoaded()
    await expectHasOnlyRootEntity({ rootEntityName: 'Cluster' })
  })

  test.each(nodeDefItems)('Cluster add children %o', async (child) => {
    await addClusterItem(child)

    const elements = await getElement({ selector: '.survey-form__node-def-page-item' })

    const items = await elements.elements()
    const last = items[items.length - 1]
    const itemText = await last.text()

    await expect(itemText.split('\n')[0]).toBe(child.label.toUpperCase())
  })

  test('Cluster add children - verify order', async () => {
    await expectNodeDefInOrder({
      items: nodeDefItems,
    })
  })

  test('Cluster add children - verify number of children', async () => {
    await expectExists({
      selector: '.survey-form__node-def-page-item',
      numberOfItems: nodeDefItems.length,
    })
  })
})
