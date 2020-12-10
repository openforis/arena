import { click, link } from '../api'

const _clickSidebarBtn = async ({ id }) => click(link({ id }))

export const clickSidebarBtnHome = async () => _clickSidebarBtn({ id: 'sidebar_btn_home' })

const _clickModule = async ({ moduleLabel, moduleId }) => {
  await _clickSidebarBtn({ id: moduleId })
  await click(moduleLabel)
}

const _clickDesignerModule = async ({ moduleLabel }) => _clickModule({ moduleLabel, moduleId: 'sidebar_btn_designer' })
const _clickAnalysisModule = async ({ moduleLabel }) => _clickModule({ moduleLabel, moduleId: 'sidebar_btn_analysis' })

export const clickSidebarBtnSurveyForm = async () => _clickDesignerModule({ moduleLabel: 'FORM DESIGNER' })

export const clickSidebarBtnDesignerCategories = async () => _clickDesignerModule({ moduleLabel: 'CATEGORIES' })

export const clickSidebarBtnDesignerTaxonomies = async () => _clickDesignerModule({ moduleLabel: 'TAXONOMIES' })

export const clickSidebarBtnAnalysisProcessingChains = async () =>
  _clickAnalysisModule({ moduleLabel: 'PROCESSING CHAINS' })
