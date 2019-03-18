import './collectImportReportView.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Checkbox from '../../../commonComponents/form/checkbox'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import CollectImportReportItem from '../../../../common/survey/collectImportReportItem'

import { fetchCollectImportReportItems, updateCollectImportReportItem } from './actions'
import { initSurveyDefs } from '../../../survey/actions'
import { setFormNodeDefEdit } from '../../surveyForm/actions'
import * as SurveyState from '../../../survey/surveyState'
import * as CollectImportReportState from './collectImportReportState'
import { appModules, appModuleUri } from '../../appModules'

const NodeDefReportItem = ({ survey, nodeDefUuid, nodeDefItems, updateCollectImportReportItem, setFormNodeDefEdit, history }) => {
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const defaultLanguage = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))

  return (
    <div className="collect-import-report-node-def-items">
      <div
        className="collect-import-report-node-def-items-header">{NodeDef.getNodeDefLabel(nodeDef, defaultLanguage)}</div>
      <div className="table__row-header collect-import-report-header">
        <div>#</div>
        <div>Type</div>
        <div>Expression</div>
        <div>Apply if</div>
        <div>Messages</div>
        <div>Resolved</div>
        <div>Edit</div>
      </div>
      {
        nodeDefItems.map((item, idx) =>
          <div
            key={idx}
            className="table__row collect-import-report-item">
            <div>{idx + 1}</div>
            <div>{CollectImportReportItem.getExpressionType(item)}</div>
            <div>{CollectImportReportItem.getExpression(item)}</div>
            <div>{CollectImportReportItem.getApplyIf(item)}</div>
            <div>{CollectImportReportItem.getMessages(item)}</div>
            <div><Checkbox
              checked={CollectImportReportItem.isResolved(item)}
              onChange={checked => updateCollectImportReportItem(item.id, checked)}
            /></div>
            <div>
              <button onClick={() => {
                history.push(appModuleUri(appModules.designer))
                //TODO improve it
                setTimeout(() => setFormNodeDefEdit(nodeDef), 1000)
              }}>EDIT
              </button>
            </div>
          </div>
        )
      }
    </div>
  )
}

class CollectImportReportView extends React.Component {

  async componentDidMount () {
    const { initSurveyDefs, fetchCollectImportReportItems } = this.props

    initSurveyDefs()

    fetchCollectImportReportItems()
  }

  render () {
    const {
      survey, reportItems,
      updateCollectImportReportItem, setFormNodeDefEdit,
      history
    } = this.props

    if (R.isEmpty(reportItems)) {
      return null
    }

    const nodeDefUuidGroups = R.groupBy(R.prop(CollectImportReportItem.keys.nodeDefUuid))(reportItems)

    return <div className="home-collect-import-report">
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
                setFormNodeDefEdit={setFormNodeDefEdit}
                history={history}/>
            )
          })
        )(nodeDefUuidGroups)
      }
    </div>
  }

}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const reportItems = CollectImportReportState.getState(state)

  return {
    survey,
    reportItems
  }
}

export default connect(
  mapStateToProps,
  {
    initSurveyDefs, fetchCollectImportReportItems, updateCollectImportReportItem,
    setFormNodeDefEdit
  }
)(CollectImportReportView)