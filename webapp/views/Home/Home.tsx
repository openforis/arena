import { Navigate } from 'react-router'

import { appModules, appModuleUri, homeModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/ModuleSwitch'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useAuthCanCreateSurvey, useAuthCanCreateTemplate } from '@webapp/store/user/hooks'

import CollectImportReport from './CollectImportReport'
import Landing from './Landing'
import { SurveyCompare } from './SurveyCompare'
import SurveyCreate from './SurveyCreate'
import SurveyInfo from './SurveyInfo'
import SurveyList from './SurveyList'
import TemplateCreate from './TemplateCreate'
import TemplateList from './TemplateList'

const HomeDashboardRedirect = () => <Navigate to={appModuleUri(appModules.dashboard)} replace />

const Home = () => {
  const canCreateSurvey = useAuthCanCreateSurvey()
  const canCreateTemplate = useAuthCanCreateTemplate()
  const canEditSurvey = useAuthCanEditSurvey()

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
        ...(canEditSurvey
          ? [
              {
                component: SurveyCompare,
                path: homeModules.surveyCompare.path,
              },
            ]
          : []),
      ]}
    />
  )
}

export default Home
