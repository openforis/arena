import { Navigate } from 'react-router'

import ModuleSwitch from '@webapp/components/moduleSwitch'

import { appModuleUri, appModules, homeModules } from '@webapp/app/appModules'
import { useAuthCanCreateSurvey, useAuthCanCreateTemplate } from '@webapp/store/user/hooks'

import CollectImportReport from './CollectImportReport'
import Landing from './Landing'
import SurveyList from './SurveyList'
import SurveyCreate from './SurveyCreate'
import SurveyInfo from './SurveyInfo'
import TemplateList from './TemplateList'
import TemplateCreate from './TemplateCreate'

const HomeDashboardRedirect = () => <Navigate to={appModuleUri(appModules.dashboard)} replace />

const Home = () => {
  const canCreateSurvey = useAuthCanCreateSurvey()
  const canCreateTemplate = useAuthCanCreateTemplate()

  return (
    <ModuleSwitch
      moduleRoot={appModules.home}
      moduleDefault={homeModules.landing}
      modules={[
        {
          component: Landing,
          path: homeModules.landing.path,
        },
        {
          component: HomeDashboardRedirect,
          path: 'dashboard',
        },
        {
          component: SurveyList,
          path: homeModules.surveyList.path,
        },
        {
          component: TemplateList,
          path: homeModules.templateList.path,
        },
        ...(canCreateSurvey
          ? [
              {
                component: SurveyCreate,
                path: homeModules.surveyNew.path,
              },
            ]
          : []),
        ...(canCreateTemplate
          ? [
              {
                component: TemplateCreate,
                path: homeModules.templateNew.path,
              },
            ]
          : []),
        {
          component: SurveyInfo,
          path: homeModules.surveyInfo.path,
        },
        {
          component: CollectImportReport,
          path: homeModules.collectImportReport.path,
        },
      ]}
    />
  )
}

export default Home
