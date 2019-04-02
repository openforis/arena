import React from 'react'
import { connect } from 'react-redux'

import Record from '../../../../../../common/record/record'
import Node from '../../../../../../common/record/node'
import AuthManager from '../../../../../../common/auth/authManager'

import NodeDefTableBody from '../../../../surveyForm/nodeDefs/components/nodeDefTableBody'

import * as SurveyState from '../../../../../survey/surveyState'
import { createNodePlaceholder, removeNode, updateNode } from '../../../../surveyForm/record/actions'
import * as AppState from '../../../../../app/appState'

class TableColumnEdit extends React.Component {

  render () {
    const {
      surveyInfo, canEditRecord,
      nodeDef, record, cell,
      updateNode, removeNode, createNodePlaceholder
    } = this.props

    const { parentUuid, nodes } = cell

    const parentNode = {
      [Node.keys.recordUuid]: Record.getUuid(record),
      [Node.keys.parentUuid]: parentUuid
    }

    return (
      <NodeDefTableBody
        surveyInfo={surveyInfo}
        nodeDef={nodeDef}
        parentNode={parentNode}
        nodes={nodes}
        entry={true}
        edit={false}
        canEditRecord={canEditRecord}
        updateNode={updateNode}
        removeNode={removeNode}
        createNodePlaceholder={createNodePlaceholder}
      />
    )
  }
}

const mapStateToProps = (state, props) => {
  const { record } = props
  const surveyInfo = SurveyState.getStateSurveyInfo(state)
  const user = AppState.getUser(state)

  return {
    surveyInfo,
    canEditRecord: AuthManager.canEditRecord(user, record),
  }
}

export default connect(
  mapStateToProps,
  {
    updateNode, removeNode, createNodePlaceholder
  }
)(TableColumnEdit)