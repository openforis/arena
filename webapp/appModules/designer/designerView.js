import './style.scss'

import React from 'react'
import { connect } from 'react-redux'

import TabBar from '../../commonComponents/tabBar'
import SurveyInfoComponent from './components/surveyInfoComponent'
import SurveyFormView from '../../survey/form/components/surveyFormView'
import CodeListsView from '../../survey/codeLists/codeListsView'
import TaxonomiesView from '../../survey/taxonomies/taxonomiesView'

import { fetchNodeDefs } from '../../survey/nodeDefs/actions'
import { fetchCodeLists } from '../../survey/codeLists/actions'
import { fetchTaxonomies } from '../../survey/taxonomies/actions'
import { resetForm } from '../../survey/form/actions'

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
          {label: 'Survey Info', component: SurveyInfoComponent},
          {label: 'Form Designer', component: SurveyFormView, props: {edit: true, draft: true}},
          {label: 'Code Lists', component: CodeListsView},
          {label: 'Taxonomies', component: TaxonomiesView},
        ]}/>
    )
  }
}

export default connect(
  null,
  {fetchNodeDefs, fetchCodeLists, fetchTaxonomies, resetForm}
)(DesignerView)