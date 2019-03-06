import './designerView.scss'

import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'

import AuthManager from '../../../common/auth/authManager'

import TabBar from '../../commonComponents/tabBar'
import SurveyFormView from '../surveyForm/surveyFormView'
import SurveyHierarchy from './components/surveyHierarchy'
import RecordView from '../data/records/components/recordView'
import CategoriesView from '../surveyForm/components/categoriesView'
import TaxonomiesView from '../surveyForm/components/taxonomiesView'

import { appModules, appModuleUri } from '../appModules'
import { designerModules } from './designerModules'

import * as AppState from '../../app/appState'
import * as SurveyState from '../../survey/surveyState'

import { initSurveyDefs } from '../../survey/actions'
import { resetForm } from '../surveyForm/actions'

class DesignerView extends React.Component {

  componentDidMount () {
    const { resetForm, initSurveyDefs, canEditDef } = this.props

    resetForm()
    initSurveyDefs(canEditDef, canEditDef)
  }

  render () {
    const { history, location, canEditDef } = this.props

    return location.pathname === appModuleUri(appModules.designer)
      ? (
        <Redirect to={appModuleUri(designerModules.formDesigner)}/>
      )
      : (
        <TabBar
          className="designer"
          location={location}
          history={history}
          tabs={[
            {
              label: 'Form Designer',
              component: SurveyFormView,
              path: appModuleUri(designerModules.formDesigner),
              props: { edit: true, draft: true, canEditDef },
            },

            {
              label: 'Hierarchy',
              component: SurveyHierarchy,
              path: appModuleUri(designerModules.surveyHierarchy)
            },

            {
              label: 'Form preview',
              component: RecordView,
              path: `${appModuleUri(designerModules.recordPreview)}:recordUuid`,
              props: { edit: true, draft: true, canEditDef, preview: true },
              showTab: false,
            },

            {
              label: 'Categories',
              component: CategoriesView,
              path: appModuleUri(designerModules.categories)
            },

            {
              label: 'Taxonomies',
              component: TaxonomiesView,
              path: appModuleUri(designerModules.taxonomies)
            },

          ]}
        />
      )
  }
}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getStateSurveyInfo(state)

  return {
    canEditDef: AuthManager.canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  { initSurveyDefs, resetForm }
)(DesignerView)
