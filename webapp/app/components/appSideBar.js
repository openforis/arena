import { appModules } from '../../appModules/appModules'

export const appModulesSideBar = [
  {
    module: appModules.home,
    icon: 'home2',
    label: 'Home',
  },
  {
    module: appModules.surveyDashboard,
    icon: 'office',
    label: 'Dashboard',
  },
  {
    module: appModules.surveyDesigner,
    icon: 'quill',
    label: 'Designer',
  },
  {
    module: appModules.dataExplorer,
    icon: 'table2',
    label: 'Data',
    disabled: true,
  },
  {
    module: appModules.dataAnalysis,
    icon: 'calculator',
    label: 'Analysis',
    disabled: true,
  },
  {
    module: appModules.users,
    icon: 'users',
    label: 'Users',
    disabled: true,
  },
]