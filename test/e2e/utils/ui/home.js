import { click, link } from '../api'

const _clickHomeBtn = async ({ label }) => {
  await click(link(label))
}

export const clickHomeBtnEditSurveyInfo = async () => _clickHomeBtn({ label: 'Edit info' })
