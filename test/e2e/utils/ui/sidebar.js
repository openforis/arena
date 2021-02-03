import { click, link } from '../api'

const _clickSidebarBtn = async ({ id }) => click(link({ id }))

export const clickSidebarBtnHome = async () => _clickSidebarBtn({ id: 'sidebar_btn_home' })

const _clickModule = async ({ moduleLabel, moduleId }) => {
  await _clickSidebarBtn({ id: moduleId })
  await click(moduleLabel)
}

const _clickDesignerModule = async ({ moduleLabel }) => _clickModule({ moduleLabel, moduleId: 'sidebar_btn_designer' })
const _clickAnalysisModule = async ({ moduleLabel }) => _clickModule({ moduleLabel, moduleId: 'sidebar_btn_analysis' })
const _clickDataModule = async ({ moduleLabel }) => _clickModule({ moduleLabel, moduleId: 'sidebar_btn_data' })
const _clickUsersModule = async ({ moduleLabel }) => _clickModule({ moduleLabel, moduleId: 'sidebar_btn_users' })

export const clickSidebarBtnSurveyForm = async () => _clickDesignerModule({ moduleLabel: 'FORM DESIGNER' })

export const clickSidebarBtnDesignerCategories = async () => _clickDesignerModule({ moduleLabel: 'CATEGORIES' })

export const clickSidebarBtnDesignerTaxonomies = async () => _clickDesignerModule({ moduleLabel: 'TAXONOMIES' })

export const clickSidebarBtnAnalysisProcessingChains = async () =>
  _clickAnalysisModule({ moduleLabel: 'PROCESSING CHAINS' })

export const clickSiderbarBtnDataRecords = async () => _clickDataModule({ moduleLabel: 'RECORDS' })

export const clickSidebarBtnUsersList = async () => _clickUsersModule({ moduleLabel: 'USER LIST' })
