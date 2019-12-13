import axios from 'axios'
import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validation from '@core/validation/validation'

import { debounceAction } from '@webapp/utils/reduxUtils'

import { appModuleUri, designerModules } from '@webapp/loggedin/appModules'

import * as AppState from '@webapp/app/appState'
import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
import * as SurveyState from '../surveyState'
import * as NodeDefEditState from '@webapp/loggedin/surveyViews/nodeDefEdit/nodeDefEditState'

import { hideAppLoader, showAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { nodeDefEditUpdate } from '@webapp/loggedin/surveyViews/nodeDefEdit/actions'

export const nodeDefCreate = 'survey/nodeDef/create'
export const nodeDefUpdate = 'survey/nodeDef/update'
export const nodeDefPropsUpdate = 'survey/nodeDef/props/update'
export const nodeDefUpdateCancel = 'survey/nodeDef/update/cancel'
export const nodeDefDelete = 'survey/nodeDef/delete'

export const nodeDefsValidationUpdate = 'survey/nodeDefsValidation/update'
export const nodeDefsUpdate = 'survey/nodeDefs/update'

// ==== CREATE

export const createNodeDef = (parent, type, props, history) => async (dispatch, getState) => {
  const state = getState()
  const cycle = SurveyState.getSurveyCycleKey(state)

  const nodeDef = {
    ...NodeDef.newNodeDef(parent, type, cycle, props),
    persisted: false, // Used to dissoc node def on cancel if changes are not persisted
  }

  dispatch({ type: nodeDefCreate, nodeDef })

  history.push(`${appModuleUri(designerModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)
}

// ==== Internal update nodeDefs actions

const _putNodeDefProps = (nodeDef, props, propsAdvanced) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/props`, {
    cycle,
    props,
    propsAdvanced,
  })

  dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })

  if (nodeDefsUpdated) {
    dispatch({ type: nodeDefsUpdate, nodeDefs: nodeDefsUpdated })
  }
}

const _putNodeDefPropsDebounced = (nodeDef, key, props, propsAdvanced) =>
  debounceAction(
    _putNodeDefProps(nodeDef, props, propsAdvanced),
    `${nodeDefPropsUpdate}_${NodeDef.getUuid(nodeDef)}_${key}`,
  )

const _updateParentLayout = (nodeDef, deleted = false) => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  if (NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDefParent)) {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const layoutChildren = NodeDefLayout.getLayoutChildren(surveyCycleKey)(nodeDefParent)

    const layoutChildrenUpdated = deleted
      ? R.without([nodeDefUuid])(layoutChildren)
      : R.append(nodeDefUuid)(layoutChildren)

    dispatch(putNodeDefLayoutProp(nodeDefParent, NodeDefLayout.keys.layoutChildren, layoutChildrenUpdated))
  }
}

const _checkCanChangeProp = (dispatch, nodeDef, key, value) => {
  if (key === NodeDef.propKeys.multiple && value && NodeDef.hasDefaultValues(nodeDef)) {
    // NodeDef has default values, cannot change into multiple
    dispatch(
      showNotification(
        'nodeDefEdit.cannotChangeIntoMultipleWithDefaultValues',
        null,
        NotificationState.severity.warning,
      ),
    )
    return false
  }

  return true
}

/**
 * Applies changes only to node def in state
 */
export const putNodeDefProp = (nodeDef, key, value = null, advanced = false, checkFormPageUuid = false) => async (
  dispatch,
  getState,
) => {
  if (!_checkCanChangeProp(dispatch, nodeDef, key, value)) {
    return
  }

  const state = getState()
  const surveyState = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const parentNodeDef = Survey.getNodeDefParent(nodeDef)(surveyState)

  const props = advanced ? {} : { [key]: value }
  const propsAdvanced = advanced ? { [key]: value } : {}

  if (key === NodeDef.propKeys.multiple) {
    // If setting "multiple", reset validations required or count
    propsAdvanced[NodeDef.propKeys.validations] = value
      ? NodeDefValidations.dissocRequired(NodeDef.getValidations(nodeDef))
      : NodeDefValidations.dissocCount(NodeDef.getValidations(nodeDef))
  }

  const nodeDefUpdated = R.pipe(R.mergeLeft(propsAdvanced), props => NodeDef.mergeProps(props)(nodeDef))(props)

  // Validate node def
  const survey = R.pipe(
    Survey.assocNodeDefs({ [NodeDef.getUuid(nodeDefUpdated)]: nodeDefUpdated }),
    Survey.buildAndAssocDependencyGraph,
  )(surveyState)

  const nodeDefValidation = await SurveyValidator.validateNodeDef(survey, nodeDefUpdated)

  dispatch({
    type: nodeDefPropsUpdate,
    nodeDef: nodeDefUpdated,
    nodeDefValidation,
    parentNodeDef,
    props,
    propsAdvanced,
    surveyCycleKey,
    checkFormPageUuid,
  })
}

const _updateLayoutProp = (state, nodeDef, key, value) => {
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  return R.pipe(
    NodeDefLayout.getLayout,
    R.assocPath([surveyCycleKey, key], value),
    R.when(R.always(key === NodeDefLayout.keys.renderType), layout => {
      const layoutCycle = layout[surveyCycleKey]

      // If setting layout render mode (table | form), set the the proper layout
      const isRenderTable = value === NodeDefLayout.renderType.table
      const isRenderForm = value === NodeDefLayout.renderType.form

      if (isRenderTable) {
        layoutCycle[NodeDefLayout.keys.layoutChildren] = Survey.getNodeDefChildren(nodeDef)(survey).map(n =>
          NodeDef.getUuid(n),
        )
      } else if (isRenderForm && NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)) {
        // Entity rendered as form can only exists in its own page
        layoutCycle[NodeDefLayout.keys.pageUuid] = uuidv4()
      }

      return layout
    }),
  )(nodeDef)
}

export const updateNodeDefEditLayoutProp = (key, value) => async (dispatch, getState) => {
  const state = getState()
  const nodeDef = NodeDefEditState.getNodeDef(state)
  const layoutUpdated = _updateLayoutProp(state, nodeDef, key, value)

  dispatch(putNodeDefProp(nodeDef, NodeDefLayout.keys.layout, layoutUpdated))
}

export const putNodeDefLayoutProp = (nodeDef, key, value) => async (dispatch, getState) => {
  const state = getState()
  const layoutUpdated = _updateLayoutProp(state, nodeDef, key, value)

  dispatch(
    _putNodeDefPropsDebounced(nodeDef, NodeDefLayout.keys.layout, { [NodeDefLayout.keys.layout]: layoutUpdated }),
  )
  // Const checkFormPageUuid = R.includes(key, [NodeDefLayout.keys.renderType, NodeDefLayout.keys.pageUuid])
  // dispatch(putNodeDefProp(nodeDef, NodeDefLayout.keys.layout, layoutUpdate, false, checkFormPageUuid))
}

export const cancelNodeDefEdit = history => async (dispatch, getState) => {
  const state = getState()
  const nodeDef = NodeDefEditState.getNodeDef(state)
  const nodeDefOriginal = NodeDefEditState.getNodeDefOriginal(state)
  const isNodeDefNew = R.propEq('persisted', false, nodeDef)
  const i18n = AppState.getI18n(state)

  if (!NodeDefEditState.isDirty(state) || confirm(i18n.t('surveyForm.nodeDefEditFormActions.confirmCancel'))) {
    dispatch({
      type: nodeDefUpdateCancel,
      nodeDef,
      nodeDefOriginal,
      isNodeDefNew,
    })
    history.goBack()
  }
}

export const saveNodeDef = () => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)
  const nodeDef = NodeDefEditState.getNodeDef(state)
  const props = NodeDefEditState.getPropsUpdated(state)
  const propsAdvanced = NodeDefEditState.getPropsAdvancedUpdated(state)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  dispatch(showAppLoader())

  const isNewNodeDef = R.propEq('persisted', false, nodeDef)
  const nodeDefUpdated = R.dissoc('persisted', nodeDef)

  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = isNewNodeDef
    ? await axios.post(`/api/survey/${surveyId}/nodeDef`, nodeDefUpdated)
    : await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/props`, {
        cycle,
        props,
        propsAdvanced,
      })

  dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })

  if (nodeDefsUpdated) {
    dispatch({ type: nodeDefsUpdate, nodeDefs: nodeDefsUpdated })
  }

  if (isNewNodeDef) dispatch(_updateParentLayout(nodeDef))

  // Update edited node def in state
  dispatch({
    type: nodeDefEditUpdate,
    nodeDef: nodeDefUpdated,
    nodeDefParent: Survey.getNodeDefParent(nodeDef)(survey),
    surveyCycleKey: cycle,
    nodeDefValidation: Validation.getFieldValidation(nodeDefUuid)(nodeDefsValidation),
  })

  dispatch(hideAppLoader())
}

// ==== DELETE
export const removeNodeDef = nodeDef => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)

  // Check if nodeDef is referenced by other node definitions
  // dependency graph is not associated to the survey in UI, it's built every time it's needed
  const dependencyGraph = Survey.buildDependencyGraph(survey)
  const surveyWithDependencies = Survey.assocDependencyGraph(dependencyGraph)(survey)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefDependentsUuids = Survey.getNodeDefDependencies(nodeDefUuid)(surveyWithDependencies)
  const i18n = AppState.getI18n(state)

  if (!(R.isEmpty(nodeDefDependentsUuids) || R.equals(nodeDefDependentsUuids, [nodeDefUuid]))) {
    // Node has not dependencies or it has expressions that depend on itself
    const nodeDefDependents = R.pipe(
      R.map(
        R.pipe(
          nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey),
          nodeDef => NodeDef.getLabel(nodeDef, i18n.lang),
        ),
      ),
      R.join(', '),
    )(nodeDefDependentsUuids)

    dispatch(
      showNotification(
        'nodeDefEdit.cannotDeleteNodeDefReferenced',
        {
          nodeDef: NodeDef.getLabel(nodeDef, i18n.lang),
          nodeDefDependents,
        },
        NotificationState.severity.warning,
      ),
    )
  } else if (window.confirm(i18n.t('surveyForm.nodeDefEditFormActions.confirmDelete'))) {
    // Delete confirmed
    dispatch({ type: nodeDefDelete, nodeDef })

    const surveyId = Survey.getId(survey)
    const cycle = SurveyState.getSurveyCycleKey(state)

    const {
      data: { nodeDefsValidation },
    } = await axios.delete(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}`, {
      params: cycle,
    })
    dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })

    dispatch(_updateParentLayout(nodeDef, true))
  }
}
