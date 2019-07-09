import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { nodeDefRenderType } from '../../../../../../../common/survey/nodeDefLayout'
import Record from '../../../../../../../common/record/record'
import Node from '../../../../../../../common/record/node'
import Authorizer from '../../../../../../../common/auth/authorizer'

import NodeDefTableCellBody from '../../../../../surveyViews/surveyForm/nodeDefs/components/nodeDefTableCellBody'

import { createNodePlaceholder, removeNode, updateNode } from '../../../../../surveyViews/record/actions'
import * as SurveyState from '../../../../../../survey/surveyState'
import * as AppState from '../../../../../../app/appState'

class TableColumnEdit extends React.Component {

  render () {
    const {
      surveyInfo, canEditRecord,
      nodeDef, record, cell,
      updateNode, removeNode, createNodePlaceholder
    } = this.props

    if (cell) {
      const { parentUuid, nodes } = cell
      const nodesArray = R.values(nodes)

      const parentNode = {
        [Node.keys.recordUuid]: Record.getUuid(record),
        [Node.keys.parentUuid]: parentUuid
      }

      return (
        <NodeDefTableCellBody
          surveyInfo={surveyInfo}
          nodeDef={nodeDef}
          parentNode={parentNode}
          nodes={nodesArray}
          entry={true}
          edit={false}
          renderType={nodeDefRenderType.tableBody}
          canEditRecord={canEditRecord}
          updateNode={updateNode}
          removeNode={removeNode}
          createNodePlaceholder={createNodePlaceholder}
        />
      )
    } else {
      return null
    }
  }
}

const mapStateToProps = (state, props) => {
  const { record } = props
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)

  return {
    surveyInfo,
    canEditRecord: Authorizer.canEditRecord(user, record),
  }
}

export default connect(
  mapStateToProps,
  {
    updateNode, removeNode, createNodePlaceholder
  }
)(TableColumnEdit)