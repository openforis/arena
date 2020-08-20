const { button, link } = require('taiko')
const { clickElement } = require('./common')

const clickHeaderBtn = async ({ label }) => {
  await clickElement(button({ class: 'header__btn-user' }))
  await clickElement(link(label))
}

export const clickHeaderBtnMySurveys = async () => clickHeaderBtn({ label: 'My Surveys' })

export const clickHeaderBtnCreateSurvey = async () => clickHeaderBtn({ label: 'Create Survey' })
