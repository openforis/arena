import './SurveyForm.scss'
import './react-grid-layout.scss'

import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect, useDispatch, useSelector } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { matchPath } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import { useIsSidebarOpened } from '@webapp/service/storage/sidebar'
import { SurveyFormActions, SurveyFormState } from '@webapp/store/ui/surveyForm'
import { RecordState } from '@webapp/store/ui/record'
import { SurveyState, useSurvey } from '@webapp/store/survey'
import { DataTestId } from '@webapp/utils/dataTestId'
import { dispatchWindowResize } from '@webapp/utils/domUtils'
import { useHistoryListen, useOnUpdate } from '@webapp/components/hooks'
import { appModuleUri, dataModules, designerModules } from '@webapp/app/appModules'

import { EntitySelectorTree } from '@webapp/components/survey/NodeDefsSelector'
import FormHeader from './FormHeader'
import AddNodeDefPanel from './components/addNodeDefPanel'
import NodeDefSwitch from './nodeDefs/nodeDefSwitch'

const SurveyForm = (props) => {
  const {
    analysis,
    surveyInfo,
    surveyCycleKey,
    nodeDef,
    edit,
    entry,
    preview,
    hasNodeDefAddChildTo,
    showPageNavigation,
    canEditDef,
    canEditRecord,
    recordUuid,
    parentNode,
  } = props

  const dispatch = useDispatch()
  const state = useSelector((rootState) => rootState)
  const isSideBarOpened = useIsSidebarOpened()
  const survey = useSurvey()
  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  const editAllowed = edit && canEditDef

  let className = editAllowed ? ' edit' : ''
  className += hasNodeDefAddChildTo ? '' : ' form-actions-off'
  className += showPageNavigation ? '' : ' page-navigation-off'

  // If showPageNavigation, addNodeDefAddChildTo or sideBar change, trigger window resize to re-render react-grid-layout form
  useOnUpdate(() => {
    const reactGridLayoutElems = document.querySelectorAll('.react-grid-layout')
    for (const el of reactGridLayoutElems) {
      el.classList.remove('mounted')
    }

    dispatchWindowResize()
    setTimeout(() => {
      for (const el of reactGridLayoutElems) {
        el.classList.add('mounted')
      }
    }, 100)
  }, [showPageNavigation, hasNodeDefAddChildTo, isSideBarOpened])

  // On cycle update, reset form
  useOnUpdate(() => {
    dispatch(SurveyFormActions.resetForm())
  }, [surveyCycleKey])

  useEffect(() => {
    // OnUnmount if it's in editAllowed mode, set nodeDefAddChildTo to null
    return () => {
      if (editAllowed) {
        dispatch(SurveyFormActions.setFormNodeDefAddChildTo(null))
      }
    }
  }, [])

  useEffect(() => {
    // reset form between records
    return () => {
      // the entity navigation state should remain if we open a nodeDef
      if (
        !matchPath(window.location.pathname, {
          path: [appModuleUri(designerModules.formDesigner), appModuleUri(designerModules.nodeDef)],
        })
      ) {
        dispatch(SurveyFormActions.resetForm())
      }
    }
  }, [])

  useHistoryListen(() => {
    // the entity navigation state should be reset if we change from designer to records
    if (
      matchPath(window.location.pathname, {
        path: appModuleUri(canEditDef ? dataModules.records : designerModules.formDesigner),
      })
    ) {
      dispatch(SurveyFormActions.resetForm())
    }
  }, [])

  if (!nodeDef) {
    return null
  }

  return (
    <div>
      <FormHeader edit={edit} analysis={analysis} entry={entry} preview={preview} canEditDef={canEditDef} />

      <div className={`survey-form${className}`} data-testid={DataTestId.surveyForm.surveyForm}>
        {showPageNavigation && (
          <EntitySelectorTree
            isDisabled={(nodeDefArg) => {
              const parentNodeArg = SurveyFormState.getFormPageParentNode(nodeDefArg)(state)
              return !(
                edit ||
                NodeDef.isRoot(nodeDefArg) ||
                NodeDef.getUuid(nodeDefRoot) === NodeDef.getParentUuid(nodeDefArg) ||
                Boolean(parentNodeArg)
              )
            }}
            nodeDefUuidActive={NodeDef.getUuid(nodeDef)}
            onlyPages
            onSelect={(nodeDefToSelect) => dispatch(SurveyFormActions.setFormActivePage(nodeDefToSelect))}
          />
        )}

        <NodeDefSwitch
          surveyInfo={surveyInfo}
          surveyCycleKey={surveyCycleKey}
          nodeDef={nodeDef}
          edit={edit}
          entry={entry}
          preview={preview}
          recordUuid={recordUuid}
          parentNode={parentNode}
          canEditDef={canEditDef}
          canEditRecord={canEditRecord}
        />

        {editAllowed && hasNodeDefAddChildTo && <AddNodeDefPanel />}
      </div>
    </div>
  )
}

SurveyForm.defaultProps = {
  analysis: false,
  surveyInfo: null,
  // Current nodeDef page
  nodeDef: null,
  // Form in edit mode
  edit: false,
  // Form in data entry mode
  entry: false,
  // Form in preview mode
  preview: false,
  // Can edit the form definition
  canEditDef: false,
  // Uuid of current record
  recordUuid: null,
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const nodeDef = SurveyFormState.getFormActivePageNodeDef(state)
  const hasNodeDefAddChildTo = Boolean(SurveyFormState.getNodeDefAddChildTo(state))
  const record = RecordState.getRecord(state)
  const showPageNavigation = SurveyFormState.showPageNavigation(state)

  const mapEntryProps = () => ({
    parentNode: nodeDef ? SurveyFormState.getFormPageParentNode(nodeDef)(state) : null,
    recordUuid: Record.getUuid(record),
  })

  return {
    surveyInfo,
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
    nodeDef,
    hasNodeDefAddChildTo,
    showPageNavigation,
    analysis: Record.isInAnalysisStep(record),
    ...(props.entry ? mapEntryProps() : {}),
  }
}

const enhance = compose(withRouter, connect(mapStateToProps))
export default enhance(SurveyForm)
