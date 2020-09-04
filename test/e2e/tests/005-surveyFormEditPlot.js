import { addItemToPage, addSubPage, expectItemIsTheLastNodeDef, expectItemsAreInOrderAsNodeDef } from '../utils/ui'
import { expectExists, expectToBe, getElement, hover } from '../utils/api'

const nodeDefItems = [
  { type: 'integer', name: 'plot_id', label: 'Plot id', isKey: true },
  { type: 'text', name: 'plot_text', label: 'Plot text', isKey: false },
  { type: 'file', name: 'plot_file', label: 'Plot file', isKey: false },
]

describe('SurveyForm edit Plot', () => {
  test('Plot create', async () => {
    const subPageValues = { name: 'Plot', label: 'Plot', isMultiple: true }
    await addSubPage({
      values: subPageValues,
    })

    await expectToBe({ selector: '.btn-node-def', numberOfItems: 2 })
    const pagesOnIndex = await getElement({ selector: '.btn-node-def' })
    const pagesElements = await pagesOnIndex.elements()

    await expect(pagesElements.length).toBe(2)
    await expect(await pagesElements[0].text()).toBe('Cluster')
    await expect(await pagesElements[1].text()).toBe('Plot')

    await expectToBe({ selector: '#survey-form-header__label', numberOfItems: 1 })
    const currentPageLabel = await getElement({ selector: '#survey-form-header__label' })
    await expect(await currentPageLabel.text()).toBe('Plot')

    await expectExists({ selector: '.survey-form__node-def-error-badge' })
    await hover(await getElement({ selector: '.survey-form__node-def-error-badge' }))
    await expectExists({ text: 'Define at least one child item' })
  })

  test.each(nodeDefItems)('Plot add children %o', async (child) => {
    await addItemToPage(child)
    await expectItemIsTheLastNodeDef({ item: child })
  })

  test('Plot add children - verify order', async () => expectItemsAreInOrderAsNodeDef({ items: nodeDefItems }))

  test('Plot add children - verify number of children', async () =>
    expectToBe({
      selector: '.survey-form__node-def-page-item',
      numberOfItems: nodeDefItems.length,
    }))
})
