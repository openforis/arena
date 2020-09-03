import { addSubPage } from '../utils/ui'

describe('SurveyForm edit Plot', () => {
  test('Plot create', async () => {
    const subPageValues = { name: 'Name', plot: 'Plot', isMultiple: true }
    await addSubPage({
      values: subPageValues,
    })
  })
})
