import './collectImportReportView.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Checkbox from '../../../../commonComponents/form/checkbox'
import LabelsEditor from '../../../surveyViews/labelsEditor/labelsEditor'
import NodeDefEdit from '../../../surveyViews/nodeDefEdit/nodeDefEdit'
import SurveyDefsLoader from '../../components/surveyDefsLoader'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import CollectImportReportItem from '../../../../../common/survey/collectImportReportItem'

import { fetchCollectImportReportItems, updateCollectImportReportItem } from './actions'
import { setFormNodeDefEdit } from '../../../surveyViews/surveyForm/actions'
import * as SurveyState from '../../../../survey/surveyState'
import * as CollectImportReportState from './collectImportReportState'
import * as SurveyFormState from '../../../surveyViews/surveyForm/surveyFormState'

const NodeDefReportItem = ({ survey, nodeDefUuid, nodeDefItems, updateCollectImportReportItem, onNodeDefEdit }) => {
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const defaultLanguage = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))

  return (
    <div className="collect-import-report-node-def-items">
      <div
        className="collect-import-report-node-def-items-header">{NodeDef.getLabel(nodeDef, defaultLanguage)}</div>
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
            <div>
              <LabelsEditor
                labels={CollectImportReportItem.getMessages(item)}
                languages={Survey.getLanguages(survey)}
                readOnly={true}
                showFormLabel={false}
                maxPreview={1}
                compactLanguage={true}
              />
            </div>
            <div>
              <Checkbox
                checked={CollectImportReportItem.isResolved(item)}
                onChange={checked => updateCollectImportReportItem(item.id, checked)}
              />
            </div>
            <div>
              <button onClick={() => {
                onNodeDefEdit(nodeDef)
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
    const { fetchCollectImportReportItems } = this.props

    fetchCollectImportReportItems()
  }

  handleNodeDefEdit (nodeDef) {
    this.props.setFormNodeDefEdit(nodeDef)
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
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const editedNodeDef = SurveyFormState.getFormNodeDefEdit(survey)(surveyForm)

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
    setFormNodeDefEdit
  }
)(CollectImportReportView)