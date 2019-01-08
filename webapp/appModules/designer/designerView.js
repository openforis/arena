import './designerView.scss'

import React from 'react'
import { connect } from 'react-redux'

import TabBar from '../../commonComponents/tabBar'
import SurveyInfo from './components/surveyInfo'
import SurveyFormView from '../surveyForm/surveyFormView'
import RecordView from '../data/records/components/recordView'
import Categories from '../surveyForm/components/categoriesView'
import TaxonomiesView from '../surveyForm/components/taxonomiesView'

import { initSurveyDefs } from '../../survey/actions'
import { resetForm } from '../surveyForm/actions'
import { appModules, appModuleUri } from '../appModules'
import { dashboardModules } from '../dashboard/dashboardModules'
import { getUser } from '../../app/appState'
import { getStateSurveyInfo } from '../../survey/surveyState'

import { canEditSurvey } from '../../../common/auth/authManager'

class DesignerView extends React.Component {

  componentDidMount () {
    const {resetForm, initSurveyDefs, canEdit} = this.props

    resetForm()
    initSurveyDefs(canEdit, canEdit)
  }

  render () {
    const {history, location, canEdit} = this.props

    return (
      <TabBar
        className="designer"
        location={location}
        history={history}
        tabs={[

          {
            label: 'Survey Info',
            component: SurveyInfo,
            path: appModuleUri(appModules.designer),
          },

          {
            label: 'Form Designer',
            component: SurveyFormView,
            path: appModuleUri(dashboardModules.formDesigner),
            props: {edit: true, draft: true, canEdit},
          },

          {
            label: 'Form preview',
            component: RecordView,
            // TODO recordUuid is there for testing purposes - will be deleted
            path: `${appModuleUri(dashboardModules.formDesigner)}preview`,
            props: {edit: true, draft: true, canEdit, preview: true},
            showTab: false,
          },

          {
            label: 'Categories',
            component: Categories,
            path: appModuleUri(dashboardModules.categories)
          },

          {
            label: 'Taxonomies',
            component: TaxonomiesView,
            path: appModuleUri(dashboardModules.taxonomies)
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
    canEdit: canEditSurvey(user, surveyInfo)
  }
}

export default connect(
  mapStateToProps,
  {initSurveyDefs, resetForm}
)(DesignerView)
