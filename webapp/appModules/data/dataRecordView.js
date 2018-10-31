import React from 'react'
import { connect } from 'react-redux'

import SurveyFormView from '../../survey/form/components/surveyFormView'

import { fetchNodeDefs } from '../../survey/nodeDefs/actions'
import { fetchCodeLists } from '../../survey/codeLists/actions'
import { fetchTaxonomies } from '../../survey/taxonomies/actions'
import { resetForm } from '../../survey/form/actions'

class DataRecordView extends React.Component {

  componentDidMount () {
    const {resetForm, fetchNodeDefs, fetchCodeLists, fetchTaxonomies} = this.props

    resetForm()
    fetchNodeDefs(false, false)
    fetchCodeLists(false, false)
    fetchTaxonomies(false, false)
  }

  render () {
    return (
      <SurveyFormView draft={false} edit={false} entry={true}/>
    )
  }
}

export default connect(
  null,
  {fetchNodeDefs, fetchCodeLists, fetchTaxonomies, resetForm}
)(DataRecordView)