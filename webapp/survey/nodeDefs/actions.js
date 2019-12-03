import axios from 'axios'
import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'

import { debounceAction } from '@webapp/utils/reduxUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import * as AppState from '@webapp/app/appState'

import { showNotification } from '@webapp/app/appNotification/actions'
import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
import * as SurveyState from '../surveyState'

export const nodeDefCreate = 'survey/nodeDef/create'
export const nodeDefPropsUpdate = 'survey/nodeDef/props/update'
export const nodeDefDelete = 'survey/nodeDef/delete'

export const nodeDefsValidationUpdate = 'survey/nodeDefsValidation/update'
export const nodeDefsUpdate = 'survey/nodeDefs/update'

// ==== Internal update nodeDefs actions

const _putNodeDefProps = (nodeDef, props, propsAdvanced) => async (
  dispatch,
  getState,
) => {
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

const _updateParentLayout = (nodeDef, deleted = false) => async (
  dispatch,
  getState,
) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  if (NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDefParent)) {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const layoutChildren = NodeDefLayout.getLayoutChildren(surveyCycleKey)(
      nodeDefParent,
    )

    const layoutChildrenUpdated = deleted
      ? R.without([nodeDefUuid])(layoutChildren)
      : R.append(nodeDefUuid)(layoutChildren)
    dispatch(
      putNodeDefLayoutProp(
        nodeDefParent,
        NodeDefLayout.keys.layoutChildren,
        layoutChildrenUpdated,
      ),
    )
  }
}

// ==== CREATE

export const createNodeDef = (parent, type, props) => async (
  dispatch,
  getState,
) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)

  const nodeDef = NodeDef.newNodeDef(parent, type, cycle, props)

  dispatch({ type: nodeDefCreate, nodeDef })

  const {
    data: { nodeDefsValidation },
  } = await axios.post(`/api/survey/${surveyId}/nodeDef`, nodeDef)
  dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })

  dispatch(_updateParentLayout(nodeDef))
}

// ==== UPDATE

const _checkCanChangeProp = (dispatch, nodeDef, key, value) => {
  if (
    key === NodeDef.propKeys.multiple &&
    value &&
    NodeDef.hasDefaultValues(nodeDef)
  ) {
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

export const putNodeDefProp = (
  nodeDef,
  key,
  value = null,
  advanced = false,
  checkFormPageUuid = false,
) => async (dispatch, getState) => {
  if (!_checkCanChangeProp(dispatch, nodeDef, key, value)) {
    return
  }

  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)

  const props = advanced ? {} : { [key]: value }
  const propsAdvanced = advanced ? { [key]: value } : {}

  if (key === NodeDef.propKeys.multiple) {
    // If setting "multiple", reset validations required or count
    propsAdvanced[NodeDef.propKeys.validations] = value
      ? NodeDefValidations.dissocRequired(NodeDef.getValidations(nodeDef))
      : NodeDefValidations.dissocCount(NodeDef.getValidations(nodeDef))
  }

  dispatch({
    type: nodeDefPropsUpdate,
    nodeDef,
    parentNodeDef,
    nodeDefUuid: NodeDef.getUuid(nodeDef),
    props,
    propsAdvanced,
    surveyCycleKey,
    checkFormPageUuid,
  })

  dispatch(_putNodeDefPropsDebounced(nodeDef, key, props, propsAdvanced))
}

export const putNodeDefLayoutProp = (nodeDef, key, value) => async (
  dispatch,
  getState,
) => {
  const state = getState()
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  const layoutUpdate = R.pipe(
    NodeDefLayout.getLayout,
    R.assocPath([surveyCycleKey, key], value),
    R.when(R.always(key === NodeDefLayout.keys.renderType), layout => {
      const survey = SurveyState.getSurvey(state)
      const layoutCycle = layout[surveyCycleKey]

      // If setting layout render mode (table | form), set the the proper layout
      const isRenderTable = value === NodeDefLayout.renderType.table
      const isRenderForm = value === NodeDefLayout.renderType.form

      if (isRenderTable) {
        layoutCycle[
          NodeDefLayout.keys.layoutChildren
        ] = Survey.getNodeDefChildren(nodeDef)(survey).map(n =>
          NodeDef.getUuid(n),
        )
      } else if (
        isRenderForm &&
        NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)
      ) {
        // Entity rendered as form can only exists in its own page
        layoutCycle[NodeDefLayout.keys.pageUuid] = uuidv4()
      }

      return layout
    }),
  )(nodeDef)

  const checkFormPageUuid = R.includes(key, [
    NodeDefLayout.keys.renderType,
    NodeDefLayout.keys.pageUuid,
  ])
  dispatch(
    putNodeDefProp(
      nodeDef,
      NodeDefLayout.keys.layout,
      layoutUpdate,
      false,
      checkFormPageUuid,
    ),
  )
}

// ==== DELETE
export const removeNodeDef = nodeDef => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)

  // Check if nodeDef is referenced by other node definitions
  // dependency graph is not associated to the survey in UI, it's built every time it's needed
  const dependencyGraph = Survey.buildDependencyGraph(survey)
  const surveyWithDependencies = Survey.assocDependencyGraph(dependencyGraph)(
    survey,
  )
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefDependentsUuids = Survey.getNodeDefDependencies(nodeDefUuid)(
    surveyWithDependencies,
  )
  const i18n = AppState.getI18n(state)

  if (
    !(
      R.isEmpty(nodeDefDependentsUuids) ||
      R.equals(nodeDefDependentsUuids, [nodeDefUuid])
    )
  ) {
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
  } else if (
    window.confirm(i18n.t('surveyForm.nodeDefEditFormActions.confirmDelete'))
  ) {
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
