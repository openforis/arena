import { click, link } from '../api'

const _clickSidebarBtn = async ({ id }) => {
  await click(link({ class: 'sidebar__module-btn', id }))
}

export const clickSidebarBtnHome = async () => _clickSidebarBtn({ id: 'sidebar_home' })
