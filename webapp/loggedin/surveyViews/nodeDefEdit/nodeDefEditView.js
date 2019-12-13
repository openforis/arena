import './nodeDefEditView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { useHistory, useParams } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useI18n } from '@webapp/commonComponents/hooks'
import TabBar from '@webapp/commonComponents/tabBar'

import ValidationsProps from './advanced/validationsProps'
import AdvancedProps from './advanced/advancedProps'
import BasicProps from './basic/basicProps'

import * as SurveyState from '@webapp/survey/surveyState'
import * as NodeDefEditState from './nodeDefEditState'

import { putNodeDefProp, putNodeDefLayoutProp } from '@webapp/survey/nodeDefs/actions'
import { setNodeDefUuidForEdit } from './actions'

const NodeDefEditView = props => {
  const {
    nodeDef,
    nodeDefParent,
    validation,
    nodeDefKeyEditDisabled,
    nodeDefMultipleEditDisabled,
    putNodeDefProp,
    putNodeDefLayoutProp,
    setNodeDefUuidForEdit,
  } = props

  const i18n = useI18n()
  const { nodeDefUuid } = useParams()
  const history = useHistory()

  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) {
      setNodeDefUuidForEdit(nodeDefUuid)
    }
  }, [])

  return nodeDef ? (
    <div className="node-def-edit">
      <div className="node-def-edit__container">
        <TabBar
          tabs={[
            {
              label: i18n.t('nodeDefEdit.basic'),
              component: BasicProps,
              props: {
                nodeDef,
                validation,
                nodeDefKeyEditDisabled,
                nodeDefMultipleEditDisabled,
                putNodeDefProp,
                putNodeDefLayoutProp,
              },
            },
            ...(NodeDef.isRoot(nodeDef)
              ? []
              : [
                  {
                    label: i18n.t('nodeDefEdit.advanced'),
                    component: AdvancedProps,
                    props: {
                      nodeDef,
                      validation,
                      nodeDefParent,
                      putNodeDefProp,
                    },
                  },
                  {
                    label: i18n.t('nodeDefEdit.validations'),
                    component: ValidationsProps,
                    props: {
                      nodeDef,
                      validation,
                      nodeDefParent,
                      putNodeDefProp,
                    },
                  },
                ]),
          ]}
        />

        <button
          className="btn btn-close"
          onClick={() => {
            history.goBack()
            setNodeDefUuidForEdit(null)
          }}
          aria-disabled={StringUtils.isBlank(NodeDef.getName(nodeDef))}
        >
          {i18n.t('common.done')}
        </button>
      </div>
    </div>
  ) : null
}

NodeDefEditView.defaultProps = {
  nodeDef: null,
  nodeDefParent: null,
}

const isNodeDefKeyEditDisabled = (survey, nodeDef) =>
  !nodeDef ||
  NodeDef.isRoot(nodeDef) ||
  NodeDef.isMultiple(nodeDef) ||
  (!NodeDef.isKey(nodeDef) &&
    Survey.getNodeDefKeys(Survey.getNodeDefParent(nodeDef)(survey))(survey).length >= NodeDef.maxKeyAttributes) ||
  NodeDef.isReadOnly(nodeDef)

const isNodeDefMultipleEditDisabled = (survey, nodeDef) =>
  !nodeDef ||
  NodeDef.isPublished(nodeDef) ||
  NodeDef.isKey(nodeDef) ||
  NodeDefLayout.isRenderTable(nodeDef) ||
  Survey.isNodeDefParentCode(nodeDef)(survey) ||
  NodeDef.isReadOnly(nodeDef)

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDef = NodeDefEditState.getNodeDef(state)
  const nodeDefParent = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey)
  const validation = NodeDefEditState.getNodeDefValidation(state)

  const nodeDefKeyEditDisabled = isNodeDefKeyEditDisabled(survey, nodeDef)
  const nodeDefMultipleEditDisabled = isNodeDefMultipleEditDisabled(survey, nodeDef)

  return {
    nodeDef,
    nodeDefParent,
    validation,
    nodeDefKeyEditDisabled,
    nodeDefMultipleEditDisabled,
  }
}

export default connect(mapStateToProps, {
  putNodeDefProp,
  putNodeDefLayoutProp,
  setNodeDefUuidForEdit,
})(NodeDefEditView)
