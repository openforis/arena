import './SurveyForm.scss'
import './react-grid-layout.scss'

import React, { useCallback, useEffect } from 'react'
import { connect, useDispatch } from 'react-redux'
import classNames from 'classnames'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { SurveyState, useSurvey } from '@webapp/store/survey'
import { SurveyFormActions, SurveyFormState, useNotAvailableEntityPageUuids } from '@webapp/store/ui/surveyForm'
import { useActiveNodeDefUuid, useTreeSelectViewMode } from '@webapp/store/ui/surveyForm/hooks'
import { RecordState } from '@webapp/store/ui/record'
import { useI18n } from '@webapp/store/system'
import { useIsSidebarOpened } from '@webapp/service/storage/sidebar'
import { TestId } from '@webapp/utils/testId'
import { dispatchWindowResize } from '@webapp/utils/domUtils'
import { useOnUpdate, useLocationPathMatcher } from '@webapp/components/hooks'

import { NodeDefTreeSelect } from '@webapp/components/survey/NodeDefsSelector'

import { Split } from '@webapp/components'
import { ButtonGroup } from '@webapp/components/form'

import NodeDefDetails from '../NodeDefDetails'
import { FormPagesEditButtons } from './components/FormPageEditButtons'
import AddNodeDefPanel from './components/addNodeDefPanel'
import NodeDefSwitch from './nodeDefs/nodeDefSwitch'
import FormHeader from './FormHeader'

const hasChildrenInSamePage = ({ survey, surveyCycleKey, nodeDef }) =>
  Survey.getNodeDefChildren(nodeDef)(survey).filter((childDef) =>
    NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(childDef)
  ).length > 0

const treeSelectViewModes = {
  onlyPages: 'onlyPages',
  allNodeDefs: 'allNodeDefs',
}

const treeSelectViewModeItems = Object.keys(treeSelectViewModes).map((mode) => ({
  key: mode,
  label: `surveyForm.nodeDefsTreeSelectMode.${mode}`,
}))

const InternalContainerWrapper = ({ splitContent = true, children }) =>
  splitContent ? (
    <Split sizes={[20, 80]} minSize={[0, 300]}>
      {children}
    </Split>
  ) : (
    <div className="full-width display-flex">{children}</div>
  )

const SurveyForm = (props) => {
  const {
    analysis,
    surveyInfo,
    surveyCycleKey,
    activePageNodeDef,
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

  const i18n = useI18n()
  const dispatch = useDispatch()
  const notAvailablePageEntityDefsUuids = useNotAvailableEntityPageUuids({ edit })

  const isSideBarOpened = useIsSidebarOpened()
  const survey = useSurvey()
  const treeSelectViewMode = useTreeSelectViewMode()
  const viewOnlyPages = treeSelectViewMode === treeSelectViewModes.onlyPages
  const selectedNodeDefUuid = useActiveNodeDefUuid()

  const editAllowed = edit && canEditDef

  const className = classNames('survey-form', {
    edit: editAllowed,
    'form-actions-off': !hasNodeDefAddChildTo,
    'page-navigation-off': !showPageNavigation,
    'form-preview': preview,
  })

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
      NodeDef.isEntity(activePageNodeDef) &&
      !hasChildrenInSamePage({ survey, surveyCycleKey, nodeDef: activePageNodeDef })
    ) {
      dispatch(SurveyFormActions.setFormNodeDefAddChildTo(activePageNodeDef))
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

  const onNodeDefTreeSelect = useCallback(
    (nodeDefToSelect) => {
      if (viewOnlyPages) {
        const showAddChildTo =
          NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDefToSelect) &&
          !hasChildrenInSamePage({ survey, surveyCycleKey, nodeDef: nodeDefToSelect })
        dispatch(SurveyFormActions.setFormActivePage({ nodeDef: nodeDefToSelect, showAddChildTo }))
      } else {
        dispatch(SurveyFormActions.setFormActiveNodeDefUuid(NodeDef.getUuid(nodeDefToSelect)))
      }
    },
    [dispatch, survey, surveyCycleKey, viewOnlyPages]
  )

  if (!activePageNodeDef) {
    return null
  }

  const internalContainer = viewOnlyPages ? (
    <NodeDefSwitch
      surveyInfo={surveyInfo}
      surveyCycleKey={surveyCycleKey}
      nodeDef={activePageNodeDef}
      edit={edit}
      entry={entry}
      preview={preview}
      recordUuid={recordUuid}
      parentNode={parentNode}
      canEditDef={canEditDef}
      canEditRecord={canEditRecord}
    />
  ) : (
    <NodeDefDetails nodeDefUuid={selectedNodeDefUuid} />
  )

  return (
    <div className="survey-form-wrapper">
      <FormHeader edit={edit} analysis={analysis} entry={entry} preview={preview} canEditDef={canEditDef} />

      <div className={className} data-testid={TestId.surveyForm.surveyForm}>
        {preview && <div className="preview-label">{i18n.t('common.preview')}</div>}
        {showPageNavigation && (
          <InternalContainerWrapper splitContent={viewOnlyPages}>
            <div className="survey-form__sidebar">
              <NodeDefTreeSelect
                isDisabled={(nodeDefArg) => notAvailablePageEntityDefsUuids.includes(NodeDef.getUuid(nodeDefArg))}
                nodeDefUuidActive={viewOnlyPages ? NodeDef.getUuid(activePageNodeDef) : selectedNodeDefUuid}
                onlyPages={viewOnlyPages}
                includeMultipleAttributes={!viewOnlyPages}
                includeSingleAttributes={!viewOnlyPages}
                onSelect={onNodeDefTreeSelect}
              />
              <div className="display-flex sidebar-bottom-bar">
                {edit && (
                  <ButtonGroup
                    items={treeSelectViewModeItems}
                    onChange={(mode) => dispatch(SurveyFormActions.setTreeSelectViewMode(mode))}
                    selectedItemKey={treeSelectViewMode}
                  />
                )}
                {edit && canEditDef && <FormPagesEditButtons />}
              </div>
            </div>
            {internalContainer}
          </InternalContainerWrapper>
        )}
        {!showPageNavigation && internalContainer}
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
  const activePageNodeDef = SurveyFormState.getFormActivePageNodeDef(state)
  const hasNodeDefAddChildTo = Boolean(SurveyFormState.getNodeDefAddChildTo(state))
  const record = RecordState.getRecord(state)
  const showPageNavigation = SurveyFormState.showPageNavigation(state)

  const mapEntryProps = () => ({
    parentNode: activePageNodeDef ? SurveyFormState.getFormPageParentNode(activePageNodeDef)(state) : null,
    recordUuid: Record.getUuid(record),
  })

  return {
    surveyInfo,
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
    activePageNodeDef,
    hasNodeDefAddChildTo,
    showPageNavigation,
    analysis: Record.isInAnalysisStep(record),
    ...(props.entry && record ? mapEntryProps() : {}),
  }
}

export default connect(mapStateToProps)(SurveyForm)
