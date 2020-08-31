import { click, link } from '../api'

const _clickSidebarBtn = async ({ id }) => click(link({ id }))

export const clickSidebarBtnHome = async () => _clickSidebarBtn({ id: 'sidebar_btn_home' })

export const clickSidebarBtnSurveyForm = async () => {
  await _clickSidebarBtn({ id: 'sidebar_btn_designer' })
  await click('FORM DESIGNER')
}
