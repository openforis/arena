import { click, link } from '../api'

const _clickSidebarBtn = async ({ id }) => click(link({ id }))

export const clickSidebarBtnHome = async () => _clickSidebarBtn({ id: 'sidebar_btn_home' })

const _clickDesignerModule = async ({ moduleLabel }) => {
  await _clickSidebarBtn({ id: 'sidebar_btn_designer' })
  await click(moduleLabel)
}

export const clickSidebarBtnSurveyForm = async () => _clickDesignerModule({ moduleLabel: 'FORM DESIGNER' })

export const clickSidebarBtnDesignerCategories = async () => _clickDesignerModule({ moduleLabel: 'CATEGORIES' })

export const clickSidebarBtnDesignerTaxonomies = async () => _clickDesignerModule({ moduleLabel: 'TAXONOMIES' })
