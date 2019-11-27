import React from 'react'
import { connect } from 'react-redux'

import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Authorizer from '@core/auth/authorizer'

import * as SurveyState from '@webapp/survey/surveyState'
import * as AppState from '@webapp/app/appState'
import NodeDefTableCellBody from '../../../../../surveyViews/surveyForm/nodeDefs/components/nodeDefTableCellBody'

import {
  createNodePlaceholder,
  removeNode,
  updateNode,
} from '../../../../../surveyViews/record/actions'

class TableColumnEdit extends React.Component {
  render() {
    const {
      surveyInfo,
      surveyCycleKey,
      canEditRecord,
      nodeDef,
      record,
      cell,
      updateNode,
      removeNode,
      createNodePlaceholder,
    } = this.props

    if (cell) {
      const { parentUuid, node } = cell

      const parentNode = {
        [Node.keys.recordUuid]: Record.getUuid(record),
        [Node.keys.parentUuid]: parentUuid,
      }

      return (
        <NodeDefTableCellBody
          surveyInfo={surveyInfo}
          surveyCycleKey={surveyCycleKey}
          nodeDef={nodeDef}
          parentNode={parentNode}
          nodes={[node]}
          entry={true}
          entryDataQuery={true}
          edit={false}
          renderType={NodeDefLayout.renderType.tableBody}
          canEditRecord={canEditRecord}
          updateNode={updateNode}
          removeNode={removeNode}
          createNodePlaceholder={createNodePlaceholder}
          windowed={false}
        />
      )
    }

    return null
  }
}

const mapStateToProps = (state, props) => {
  const { record } = props
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)

  return {
    surveyInfo,
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
    canEditRecord: Authorizer.canEditRecord(user, record),
  }
}

export default connect(mapStateToProps, {
  updateNode,
  removeNode,
  createNodePlaceholder,
})(TableColumnEdit)
