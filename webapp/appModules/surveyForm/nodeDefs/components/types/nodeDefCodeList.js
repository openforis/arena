import '../../nodeDefs.scss'

import React from 'react'
import { connect } from 'react-redux'
import axios from 'axios'

import NodeDefCodeListDropdown from './nodeDefCodeListDropdown'
import NodeDefCodeListCheckbox from './nodeDefCodeListCheckbox'

import NodeDef from '../../../../../../common/survey/nodeDef'
import Survey from '../../../../../../common/survey/survey'
import Record from '../../../../../../common/record/record'
import Node from '../../../../../../common/record/node'
import { isRenderDropdown } from '../../../../../../common/survey/nodeDefLayout'

import { toQueryString } from '../../../../../../server/serverUtils/request'
import { getStateSurveyInfo, getSurvey } from '../../../../../survey/surveyState'
import { getRecord } from '../../../record/recordState'
import { getSurveyForm } from '../../../surveyFormState'

class NodeDefCodeList extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      items: [],
    }
  }

  async componentDidMount () {
    const {edit} = this.props

    if (!edit) {
      await this.loadCodeListItems()
    }
  }

  async componentDidUpdate (prevProps) {
    const {parentCodeDefUUID, parentItemUUID} = this.props

    if (parentCodeDefUUID) {
      //parent item changed, reload items
      if (parentItemUUID !== prevProps.parentItemUUID) {
        await this.loadCodeListItems()
      }
    }
  }

  async loadCodeListItems () {
    const {surveyInfo, codeListId, codeListLevelIndex, parentItemUUID} = this.props

    if (codeListId && (parentItemUUID || codeListLevelIndex === 0)) {
      const params = {draft: false, parentUUID: parentItemUUID}
      const {data} = await axios.get(`/api/survey/${surveyInfo.id}/codeLists/${codeListId}/items?${toQueryString(params)}`)

      this.setState({items: data.items})
    } else {
      this.setState({items: []})
    }
  }

  render () {
    const {edit, nodeDef} = this.props
    const {items} = this.state

    return edit
      ? (
        // EDIT MODE
        <NodeDefCodeListDropdown {...this.props} />
      )
      : (
        // ENTRY MODE
        isRenderDropdown(nodeDef)
          ? <NodeDefCodeListDropdown {...this.props}
                                     items={items}/>
          : <NodeDefCodeListCheckbox {...this.props}
                                     items={items}/>
      )
  }
}

const mapStateToProps = (state, props) => {
  const survey = getSurvey(state)
  const surveyForm = getSurveyForm(state)
  const surveyInfo = getStateSurveyInfo(state)

  const record = getRecord(surveyForm)
  const {nodeDef, parentNode} = props

  const parentCodeAttribute = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
  const parentItemUUID = Node.getNodeItemUUID(parentCodeAttribute)

  const codeListLevelIndex = Survey.getNodeDefCodeListLevelIndex(nodeDef)(survey)
  const codeList = Survey.getCodeListByUUID(NodeDef.getNodeDefCodeListUUID(nodeDef))(survey)

  return {
    surveyInfo: surveyInfo,
    language: Survey.getDefaultLanguage(surveyInfo),
    parentCodeDefUUID: NodeDef.getNodeDefParentCodeUUID(nodeDef),
    codeListId: codeList ? codeList.id : null,
    codeListLevelIndex,
    parentItemUUID,
  }
}

export default connect(mapStateToProps)(NodeDefCodeList)
