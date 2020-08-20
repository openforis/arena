import { button, click, link } from '../api'

const _clickHeaderBtn = async ({ label }) => {
  await click(button({ class: 'header__btn-user' }))
  await click(link(label))
}

export const clickHeaderBtnMySurveys = async () => _clickHeaderBtn({ label: 'My Surveys' })

export const clickHeaderBtnCreateSurvey = async () => _clickHeaderBtn({ label: 'Create Survey' })
