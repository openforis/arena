import './designerView.scss'

import React from 'react'
import { connect } from 'react-redux'

import TabBar from '../../commonComponents/tabBar'
import SurveyInfo from './components/surveyInfo'
import SurveyFormView from '../surveyForm/surveyFormView'
import CodeLists from '../surveyForm/components/codeListsView'
import TaxonomiesView from '../surveyForm/components/taxonomiesView'

import { initSurveyDefs } from '../../survey/actions'
import { resetForm } from '../surveyForm/actions'
import { appModules, appModuleUri } from '../appModules'
import { dashboardModules } from '../dashboard/dashboardModules'

class DesignerView extends React.Component {

  componentDidMount () {
    const {resetForm, initSurveyDefs} = this.props

    resetForm()
    //TODO edit and validate based on user role
    initSurveyDefs(true, true)
  }

  render () {
    const {history, location} = this.props

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
            props: {edit: true, draft: true},
          },

          {
            label: 'Code Lists',
            component: CodeLists,
            path: appModuleUri(dashboardModules.codeLists)
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

export default connect(
  null,
  {initSurveyDefs, resetForm}
)(DesignerView)