import './designerView.scss'

import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'

import TabBar from '../../commonComponents/tabBar'
import SurveyInfo from './components/surveyInfo'
import SurveyFormView from '../surveyForm/surveyFormView'
import SurveyHierarchy from '../surveyForm/surveyHierarchy'
import RecordView from '../data/records/components/recordView'
import Categories from '../surveyForm/components/categoriesView'
import TaxonomiesView from '../surveyForm/components/taxonomiesView'

import { initSurveyDefs } from '../../survey/actions'
import { resetForm } from '../surveyForm/actions'
import { appModules, appModuleUri } from '../appModules'
import { designerModules } from './designerModules'
import { getUser } from '../../app/appState'
import { getStateSurveyInfo } from '../../survey/surveyState'

import { canEditSurvey } from '../../../common/auth/authManager'

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
        <Redirect to={appModuleUri(designerModules.surveyInfo)}/>
      )
      : (
        <TabBar
          className="designer"
          location={location}
          history={history}
          tabs={[

            {
              label: 'Survey Info',
              component: SurveyInfo,
              path: appModuleUri(designerModules.surveyInfo),
            },

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
              component: Categories,
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
  const user = getUser(state)
  const surveyInfo = getStateSurveyInfo(state)

  return {
    canEditDef: canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  { initSurveyDefs, resetForm }
)(DesignerView)
