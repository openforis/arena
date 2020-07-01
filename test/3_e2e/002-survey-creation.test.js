const { closeBrowser, $, evaluate, button, write, click, into, textBox, text } = require('taiko')

const { openBrowser, LoginSuccessful } = require('./fixtures')

export const FillSurvey = ({ name, label }) => async () => {
  await write(name, into(textBox({ placeholder: 'Name' })))
  await write(label, into(textBox({ placeholder: 'Label' })))
  await click('Create Survey')
}
const ContainsByText = ({ textOfElement }) => async () => {
  const elementContained = await text(textOfElement).exists()
  await expect(elementContained).toBeTruthy()
}

const ClickHeaderUserBtn = ({ buttonLabel }) => async () => {
  await evaluate(button({ class: 'header__btn-user' }), (e) => e.click())
  await click(buttonLabel)
}

describe('Survey creation', () => {
  describe('The user must be able to create new surveys, edit and delete old ones', () => {
    beforeAll(async () => {
      await openBrowser()
    })

    describe('Successful Login', LoginSuccessful)

    describe('With correct data, user is able to create a survey.', () => {
      test('Navigate to "Create Survey"', ClickHeaderUserBtn({ buttonLabel: 'Create Survey' }))

      test('Create a new survey with "survey_1" and "Survey 1"', FillSurvey({ name: 'survey_1', label: 'Survey 1' }))

      test('Page contains "Survey 1"', ContainsByText({ textOfElement: 'Survey 1' }))
    })

    describe('With correct data, user is able to create a survey. Another survey has been inserted previously.', () => {
      test('Navigate to "Create Survey"', ClickHeaderUserBtn({ buttonLabel: 'Create Survey' }))

      test('Create a new survey with "survey_2" and "Survey 2"', FillSurvey({ name: 'survey_2', label: 'Survey 2' }))

      test('Page contains "Survey 2"', ContainsByText({ textOfElement: 'Survey 2' }))
    })

    describe('When user selects a survey, the home dashboard changes its content.', () => {
      test('Navigate to "My Surveys"', ClickHeaderUserBtn({ buttonLabel: 'My Surveys' }))

      test('Page contains "Survey 1"', ContainsByText({ textOfElement: 'Survey 1' }))

      test('Page contains "Survey 2"', ContainsByText({ textOfElement: 'Survey 2' }))

      test('Click on "Survey 1"', async () => {
        await click('Survey 1')
      })

      test('Page contains .dashboard', async () => {
        const header = await $('.home-dashboard').exists()
        await expect(header).toBeTruthy()
      })

      test('Page contains "Survey 1"', ContainsByText({ textOfElement: 'Survey 1' }))
    })

    afterAll(async () => {
      await closeBrowser()
    })
  })
})
