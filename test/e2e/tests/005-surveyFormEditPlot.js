import { addSubPage } from '../utils/ui'
import { expectExists, expectToBe, getElement, hover } from '../utils/api'

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
})
