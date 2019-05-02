import './collectImportReportView.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import CollectImportReportItem from '../../../../../common/survey/collectImportReportItem'

import NodeDefEdit from '../../../surveyViews/nodeDefEdit/nodeDefEdit'
import SurveyDefsLoader from '../../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import NodeDefReportItem from './nodeDefReportItem'

import * as SurveyState from '../../../../survey/surveyState'
import * as CollectImportReportState from './collectImportReportState'
import * as NodeDefEditState from '../../../surveyViews/nodeDefEdit/nodeDefEditState'

import { setNodeDefForEdit } from '../../../surveyViews/nodeDefEdit/actions'
import { fetchCollectImportReportItems, updateCollectImportReportItem } from './actions'

class CollectImportReportView extends React.Component {

  async componentDidMount () {
    const { fetchCollectImportReportItems } = this.props

    fetchCollectImportReportItems()
  }

  handleNodeDefEdit (nodeDef) {
    this.props.setNodeDefForEdit(nodeDef)
  }

  render () {
    const {
      survey, reportItems,
      editedNodeDef,
      updateCollectImportReportItem,
    } = this.props

    if (R.isEmpty(reportItems)) {
      return null
    }

    const nodeDefUuidGroups = R.groupBy(R.prop(CollectImportReportItem.keys.nodeDefUuid))(reportItems)

    return <SurveyDefsLoader
      draft={true}
      validate={true}>
      {
        editedNodeDef &&
        <NodeDefEdit/>
      }

      <div className="home-collect-import-report">
        {
          R.pipe(
            R.keys,
            R.map(nodeDefUuid => {
              const nodeDefItems = nodeDefUuidGroups[nodeDefUuid]
              return (
                <NodeDefReportItem
                  key={nodeDefUuid}
                  survey={survey}
                  nodeDefUuid={nodeDefUuid}
                  nodeDefItems={nodeDefItems}
                  updateCollectImportReportItem={updateCollectImportReportItem}
                  onNodeDefEdit={nodeDefUuid => this.handleNodeDefEdit(nodeDefUuid)}/>
              )
            })
          )(nodeDefUuidGroups)
        }
      </div>
    </SurveyDefsLoader>
  }

}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const reportItems = CollectImportReportState.getState(state)
  const editedNodeDef = NodeDefEditState.hasNodeDef(state)

  return {
    survey,
    reportItems,
    editedNodeDef
  }
}

export default connect(
  mapStateToProps,
  {
    fetchCollectImportReportItems, updateCollectImportReportItem,
    setNodeDefForEdit
  }
)(CollectImportReportView)