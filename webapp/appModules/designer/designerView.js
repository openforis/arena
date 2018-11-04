import './style.scss'

import React from 'react'
import { connect } from 'react-redux'

import TabBar from '../../commonComponents/tabBar'
import SurveyInfo from './components/surveyInfo'
import SurveyFormView from '../surveyForm/surveyFormView'
import CodeLists from '../surveyForm/components/codeListsView'
import TaxonomiesView from '../surveyForm/components/taxonomiesView'

import { fetchNodeDefs } from '../../survey/nodeDefs/actions'
import { fetchCodeLists } from '../../survey/codeLists/actions'
import { fetchTaxonomies } from '../../survey/taxonomies/actions'
import { resetForm } from '../surveyForm/actions'

class DesignerView extends React.Component {

  componentDidMount () {
    const {resetForm, fetchNodeDefs, fetchCodeLists, fetchTaxonomies} = this.props

    resetForm()
    //TODO edit and validate based on user role
    fetchNodeDefs(true, true)
    fetchCodeLists(true, true)
    fetchTaxonomies(true, true)
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
  {fetchNodeDefs, fetchCodeLists, fetchTaxonomies, resetForm}
)(DesignerView)