import './style.scss'

import React from 'react'
import { connect } from 'react-redux'

import TabBar from '../../commonComponents/tabBar'
import SurveyInfo from './components/surveyInfo'
import SurveyFormView from '../surveyForm/surveyFormView'
import CodeLists from '../surveyForm/components/codeListsView'
import TaxonomiesView from '../surveyForm/components/taxonomiesView'

import { initSurveyDefs } from '../../survey/actions'
import { resetForm } from '../surveyForm/actions'

class DesignerView extends React.Component {

  componentDidMount () {
    const {resetForm, initSurveyDefs} = this.props

    resetForm()
    //TODO edit and validate based on user role
    initSurveyDefs(true, true)
  }

  render () {
    return (
      <TabBar
        className="survey-designer grid100"
        tabs={[
          {label: 'Survey Info', component: SurveyInfo},
          {label: 'Form Designer', component: SurveyFormView, props: {edit: true, draft: true}},
          {label: 'Code Lists', component: CodeLists},
          {label: 'Taxonomies', component: TaxonomiesView},
        ]}/>
    )
  }
}

export default connect(
  null,
  {initSurveyDefs, resetForm}
)(DesignerView)