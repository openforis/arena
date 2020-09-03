import { click, link, expectExists } from '../api'

const _clickHomeBtn = async ({ label }) => {
  await click(link(label))
}

export const clickHomeBtnEditSurveyInfo = async () => _clickHomeBtn({ label: 'Edit info' })

export const expectHomeDashboard = async ({ label }) => {
  await expectExists({ selector: '.home-dashboard' })
  await expectExists({ text: label })
}
