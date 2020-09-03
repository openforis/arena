import { addSubPage } from '../utils/ui'

describe('SurveyForm edit Plot', () => {
  test('Plot create', async () => {
    const subPageValues = { name: 'Name', label: 'Plot', isMultiple: true }
    await addSubPage({
      values: subPageValues,
    })
  })
})
