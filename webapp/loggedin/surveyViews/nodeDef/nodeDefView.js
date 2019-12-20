import './nodeDefView.scss'

import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { useHistory, useParams } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useI18n } from '@webapp/commonComponents/hooks'
import ConfirmDialog from '@webapp/commonComponents/confirmDialog'
import TabBar from '@webapp/commonComponents/tabBar'

import ValidationsProps from './advanced/validationsProps'
import AdvancedProps from './advanced/advancedProps'
import BasicProps from './basic/basicProps'

import * as SurveyState from '@webapp/survey/surveyState'
import * as NodeDefState from './nodeDefState'

import {
  setNodeDefProp,
  putNodeDefLayoutProp,
  setNodeDefLayoutProp,
  cancelNodeDefEdits,
  saveNodeDefEdits,
} from '@webapp/survey/nodeDefs/actions'
import { setNodeDefUuidForEdit } from './actions'

const NodeDefView = props => {
  const {
    nodeDef,
    nodeDefParent,
    validation,
    isDirty,
    nodeDefKeyEditDisabled,
    nodeDefMultipleEditDisabled,
    setNodeDefProp,
    putNodeDefLayoutProp,
    setNodeDefLayoutProp,
    setNodeDefUuidForEdit,
    cancelNodeDefEdits,
    saveNodeDefEdits,
  } = props

  const i18n = useI18n()
  const history = useHistory()
  const { nodeDefUuid } = useParams()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) {
      setNodeDefUuidForEdit(nodeDefUuid)
    }
  }, [])

  return nodeDef ? (
    <>
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
                  setNodeDefProp,
                  putNodeDefLayoutProp,
                  setNodeDefLayoutProp,
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
                        setNodeDefProp,
                      },
                    },
                    {
                      label: i18n.t('nodeDefEdit.validations'),
                      component: ValidationsProps,
                      props: {
                        nodeDef,
                        validation,
                        nodeDefParent,
                        setNodeDefProp,
                      },
                    },
                  ]),
            ]}
          />
          <div className="button-bar">
            <button
              className="btn btn-cancel"
              onClick={() => (isDirty ? setShowCancelConfirm(true) : cancelNodeDefEdits(history))}
            >
              {i18n.t(isDirty ? 'common.cancel' : 'common.back')}
            </button>
            <button
              className="btn btn-primary"
              onClick={saveNodeDefEdits}
              aria-disabled={!isDirty || StringUtils.isBlank(NodeDef.getName(nodeDef))}
            >
              <span className="icon icon-floppy-disk icon-left icon-12px" />
              {i18n.t('common.save')}
            </button>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <ConfirmDialog
          className="node-def-edit__cancel-confirm-dialog"
          message={i18n.t('surveyForm.nodeDefEditFormActions.confirmCancel')}
          onOk={() => {
            setShowCancelConfirm(false)
            cancelNodeDefEdits(history)
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </>
  ) : null
}

NodeDefView.defaultProps = {
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
  const nodeDef = NodeDefState.getNodeDef(state)
  const nodeDefParent = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey)
  const validation = NodeDefState.getValidation(state)
  const isDirty = NodeDefState.isDirty(state)

  const nodeDefKeyEditDisabled = isNodeDefKeyEditDisabled(survey, nodeDef)
  const nodeDefMultipleEditDisabled = isNodeDefMultipleEditDisabled(survey, nodeDef)

  return {
    nodeDef,
    nodeDefParent,
    validation,
    isDirty,
    nodeDefKeyEditDisabled,
    nodeDefMultipleEditDisabled,
  }
}

export default connect(mapStateToProps, {
  setNodeDefProp,
  putNodeDefLayoutProp,
  setNodeDefLayoutProp,
  setNodeDefUuidForEdit,
  cancelNodeDefEdits,
  saveNodeDefEdits,
})(NodeDefView)
