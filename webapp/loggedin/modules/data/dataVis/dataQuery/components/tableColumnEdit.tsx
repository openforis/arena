import React from 'react'
import { connect } from 'react-redux'

import NodeDefLayout from '../../../../../../../core/survey/nodeDefLayout'
import Record from '../../../../../../../core/record/record'
import Node from '../../../../../../../core/record/node'
import Authorizer from '../../../../../../../core/auth/authorizer'

import {NodeDefTableCellBody} from '../../../../../surveyViews/surveyForm/nodeDefs'

import { createNodePlaceholder, removeNode, updateNode } from '../../../../../surveyViews/record/actions'
import * as SurveyState from '../../../../../../survey/surveyState'
import * as AppState from '../../../../../../app/appState'

interface IProps {
  surveyInfo: any;
  surveyCycleKey: any;
  canEditRecord: any;
  nodeDef: any;
  record: any;
  cell?: { parentUuid: string, node: any };
  updateNode: any;
  removeNode: any;
  createNodePlaceholder: any;
}

class TableColumnEdit extends React.Component {
  props: IProps;

  render () {
    const props = this.props

    if (props.cell) {
      const { parentUuid, node } = props.cell

      const parentNode = {
        [Node.keys.recordUuid]: Record.getUuid(props.record),
        [Node.keys.parentUuid]: parentUuid
      }

      return (
        <NodeDefTableCellBody
          surveyInfo={props.surveyInfo}
          surveyCycleKey={props.surveyCycleKey}
          nodeDef={props.nodeDef}
          parentNode={parentNode}
          nodes={[node]}
          entry={true}
          entryDataQuery={true}
          edit={false}
          renderType={NodeDefLayout.renderType.tableBody}
          canEditRecord={props.canEditRecord}
          updateNode={updateNode}
          removeNode={removeNode}
          createNodePlaceholder={createNodePlaceholder}
          windowed={false}
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
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
    canEditRecord: Authorizer.canEditRecord(user, record),
  }
}

export default connect(
  mapStateToProps,
  {
    updateNode, removeNode, createNodePlaceholder
  }
)(TableColumnEdit)
