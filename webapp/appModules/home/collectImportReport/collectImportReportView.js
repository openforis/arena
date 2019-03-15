import './collectImportReportView.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import axios from 'axios'

import Checkbox from '../../../commonComponents/form/checkbox'

import CollectImportReportItem from '../../../../common/survey/collectImportReportItem'

import * as SurveyState from '../../../survey/surveyState'

const NodeDefReportItem = ({ item }) => {

  const issueTypes = R.keys(CollectImportReportItem.getProps(item))

  return <div className="collect-import-report-node-def-items">
    <div>{CollectImportReportItem.getNodeDefUuid(item)}</div>
    <div className="collect-import-report-header">
      <div>#</div>
      <div>Type</div>
      <div>Expression</div>
      <div>Apply if</div>
      <div>Messages</div>
      <div>Resolved</div>
      <div>Edit</div>
    </div>
    {
      issueTypes.map((exprType, idx) => {
        const issue = CollectImportReportItem.getIssue(exprType)(item)
        return (
          <div
            key={idx}
            className="collect-import-report-item">
            <div>{idx + 1}</div>
            <div>{exprType}</div>
            <div>{CollectImportReportItem.getExpression(issue)}</div>
            <div>{CollectImportReportItem.getApplyIf(issue)}</div>
            <div>{CollectImportReportItem.getMessages(issue)}</div>
            <div><Checkbox checked={CollectImportReportItem.isResolved(item)}/></div>
            <div><button>EDIT</button></div>
          </div>
        )
      })
    }
  </div>
}

class CollectImportReportView extends React.Component {

  constructor (props) {
    super(props)

    this.state = { items: [] }
  }

  async componentDidMount () {
    const { surveyId } = this.props

    const { data } = await axios.get(`/api/survey/${surveyId}/collect-import-report`)
    const { items } = data

    this.setState({ items })
  }

  render () {
    const { items } = this.state

    const nodeDefUuidGroups =R.groupBy(R.prop(CollectImportReportItem.keys.nodeDefUuid))(items)

    return <div className="home-collect-import-report">
      {

        nodeDefUuidGroups.map(nodeDefUuid => {
          const nodeDefItems = nodeDefUuidGroups[nodeDefUuid]
          return <NodeDefReportItem
            key={nodeDefUuid}
            nodeDefUuid={nodeDefUuid}
            nodeDefItems={nodeDefItems}/>
        })
      }
    </div>
  }

}

const mapStateToProps = state => {
  const surveyId = SurveyState.getStateSurveyId(state)

  return {
    surveyId
  }
}

export default connect(
  mapStateToProps
)(CollectImportReportView)