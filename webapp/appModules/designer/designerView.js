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
import { designerModules } from './designerModules'
import { getUser } from '../../app/appState'
import { getStateSurveyInfo } from '../../survey/surveyState'

import { canEditSurvey } from '../../../common/auth/authManager'

class DesignerView extends React.Component {

  componentDidMount () {
    const {resetForm, initSurveyDefs, canEditDef} = this.props

    resetForm()
    initSurveyDefs(canEditDef, canEditDef)
  }

  render () {
    const {history, location, canEditDef} = this.props

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
            path: appModuleUri(designerModules.formDesigner),
            props: {edit: true, draft: true, canEditDef},
          },

          {
            label: 'Form preview',
            component: RecordView,
            path: `${appModuleUri(designerModules.recordPreview)}:recordUuid`,
            props: {edit: true, draft: true, canEditDef, preview: true},
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
  {initSurveyDefs, resetForm}
)(DesignerView)
