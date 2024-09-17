import './SurveyForm.scss'
import './react-grid-layout.scss'

import React, { useEffect } from 'react'
import { connect, useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { SurveyState, useSurvey } from '@webapp/store/survey'
import { SurveyFormActions, SurveyFormState, useNotAvailableEntityPageUuids } from '@webapp/store/ui/surveyForm'
import { RecordState } from '@webapp/store/ui/record'
import { useI18n } from '@webapp/store/system'
import { useIsSidebarOpened } from '@webapp/service/storage/sidebar'
import { TestId } from '@webapp/utils/testId'
import { dispatchWindowResize } from '@webapp/utils/domUtils'
import { useOnUpdate, useLocationPathMatcher } from '@webapp/components/hooks'

import { EntitySelectorTree } from '@webapp/components/survey/NodeDefsSelector'

import { Split } from '@webapp/components'
import { FormPagesEditButtons } from './components/FormPageEditButtons'
import FormHeader from './FormHeader'
import AddNodeDefPanel from './components/addNodeDefPanel'
import NodeDefSwitch from './nodeDefs/nodeDefSwitch'

const hasChildrenInSamePage = ({ survey, surveyCycleKey, nodeDef }) =>
  Survey.getNodeDefChildren(nodeDef)(survey).filter((childDef) =>
    NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(childDef)
  ).length > 0

const SurveyForm = (props) => {
  const {
    analysis = false,
    surveyInfo = null,
    // Current nodeDef page
    nodeDef = null,
    // Form in edit mode
    edit = false,
    // Form in data entry mode
    entry = false,
    // Form in preview mode
    preview = false,
    // Can edit the form definition
    canEditDef = false,
    // Uuid of current record
    recordUuid = null,

    surveyCycleKey,
    hasNodeDefAddChildTo,
    showPageNavigation,
    canEditRecord,
    parentNode,
  } = props

  const i18n = useI18n()
  const dispatch = useDispatch()
  const notAvailablePageEntityDefsUuids = useNotAvailableEntityPageUuids({ edit })

  const isSideBarOpened = useIsSidebarOpened()
  const survey = useSurvey()
  const editAllowed = edit && canEditDef

  let className = editAllowed ? ' edit' : ''
  className += hasNodeDefAddChildTo ? '' : ' form-actions-off'
  className += showPageNavigation ? '' : ' page-navigation-off'
  className += preview ? ' form-preview' : ''

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
    // on mount, if edit is allowed and node def is empty, show add child to sidebar
    if (
      editAllowed &&
      !hasNodeDefAddChildTo &&
      NodeDef.isEntity(nodeDef) &&
      !hasChildrenInSamePage({ survey, surveyCycleKey, nodeDef })
    ) {
      dispatch(SurveyFormActions.setFormNodeDefAddChildTo(nodeDef))
    }

    // OnUnmount if it's in editAllowed mode, set nodeDefAddChildTo to null
    return () => {
      if (editAllowed) {
        dispatch(SurveyFormActions.setFormNodeDefAddChildTo(null))
      }
    }
  }, [])

  const pathMatcher = useLocationPathMatcher()

  useEffect(() => {
    // reset form on unmount and not editing survey form or node def
    return () => {
      // the entity navigation state should remain if we open a nodeDef
      if (
        !pathMatcher(appModuleUri(designerModules.formDesigner)) &&
        !pathMatcher(`${appModuleUri(designerModules.nodeDef)}:uuid`)
      ) {
        dispatch(SurveyFormActions.resetForm())
      }
    }
  }, [])

  if (!nodeDef) {
    return null
  }

  const internalContainer = (
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
  )

  return (
    <div className="survey-form-wrapper">
      <FormHeader edit={edit} analysis={analysis} entry={entry} preview={preview} canEditDef={canEditDef} />

      <div className={`survey-form${className}`} data-testid={TestId.surveyForm.surveyForm}>
        {preview && <div className="preview-label">{i18n.t('common.preview')}</div>}
        {showPageNavigation && (
          <Split sizes={[20, 80]} minSize={[0, 300]}>
            <div className="survey-form__sidebar">
              <EntitySelectorTree
                isDisabled={(nodeDefArg) => notAvailablePageEntityDefsUuids.includes(NodeDef.getUuid(nodeDefArg))}
                nodeDefUuidActive={NodeDef.getUuid(nodeDef)}
                onlyPages
                onSelect={(nodeDefToSelect) => {
                  const showAddChildTo =
                    NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDefToSelect) &&
                    !hasChildrenInSamePage({ survey, surveyCycleKey, nodeDef: nodeDefToSelect })
                  dispatch(SurveyFormActions.setFormActivePage({ nodeDef: nodeDefToSelect, showAddChildTo }))
                }}
              />

              {edit && canEditDef && <FormPagesEditButtons />}
            </div>
            {internalContainer}
          </Split>
        )}
        {!showPageNavigation && internalContainer}
        {editAllowed && hasNodeDefAddChildTo && <AddNodeDefPanel />}
      </div>
    </div>
  )
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
    ...(props.entry && record ? mapEntryProps() : {}),
  }
}

export default connect(mapStateToProps)(SurveyForm)
