import './designerView.scss'

import React from 'react'
import { connect } from 'react-redux'

import AuthManager from '../../../../common/auth/authManager'

import SurveyDefsLoader from '../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import NavigationTabBar from '../components/moduleNavigationTabBar'
import SurveyFormView from '../../surveyViews/surveyForm/surveyFormView'
import SurveyHierarchy from './components/surveyHierarchy'
import RecordView from '../data/records/components/recordView'
import CategoriesView from '../../surveyViews/categories/categoriesView'
import TaxonomiesView from '../../surveyViews/taxonomies/taxonomiesView'

import { appModules, appModuleUri } from '../../appModules'
import { designerModules } from './designerModules'

import * as AppState from '../../../app/appState'
import * as SurveyState from '../../../survey/surveyState'

import { resetForm } from '../../surveyViews/surveyForm/actions'

class DesignerView extends React.Component {

  componentDidMount () {
    this.props.resetForm()
  }

  render () {
    const { canEditDef } = this.props

    return (
      <SurveyDefsLoader
        draft={canEditDef}
        validate={canEditDef}>

        <NavigationTabBar
          className="designer app-module__tab-navigation"
          moduleRoot={appModules.designer}
          moduleDefault={designerModules.formDesigner}
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
      </SurveyDefsLoader>
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
  { resetForm }
)(DesignerView)
