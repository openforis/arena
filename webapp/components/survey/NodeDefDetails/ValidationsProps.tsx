import { useCallback, useMemo } from 'react'

import { type ArenaAnyNodeDef, Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import Checkbox from '@webapp/components/form/Checkbox'
import { FormItem, NumberFormats } from '@webapp/components/form/Input'
import ValidationTooltip from '@webapp/components/ValidationTooltip'
import { useSurvey } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { NodeDefExpressionsProp, ValueType } from './ExpressionsProp'
import { State, useNodeDefEditReadOnly } from './store'

const countTypes = [NodeDefValidations.keys.min, NodeDefValidations.keys.max]

const requiredRadioModes = {
  none: 'none',
  always: 'always',
  defined: 'defined',
}

const determineRequiredRadioMode = ({ nodeDef }) => {
  const validations = NodeDef.getValidations(nodeDef)
  if (NodeDefValidations.isRequiredIfDefined(validations)) return requiredRadioModes.defined
  if (NodeDefValidations.isRequired(validations)) return requiredRadioModes.always
  return requiredRadioModes.none
}

const countPropNumberFormat = NumberFormats.integer({ allowNegative: false })

type CountPropProps = {
  Actions: Record<string, any>
  countType: string
  nodeDef: ArenaAnyNodeDef
  nodeDefUuidContext: string
  readOnly?: boolean
  state: Record<string, any>
}

const CountProp = (props: CountPropProps) => {
  const { Actions, countType, nodeDef, nodeDefUuidContext, readOnly, state } = props

  const countPropExtractor = (countType) => (nodeDef) => {
    const count = A.pipe(NodeDef.getValidations, NodeDefValidations.getCountProp(countType))(nodeDef)
    if (Objects.isEmpty(count)) return []
    if (Array.isArray(count)) return count
    return [NodeDefExpression.createExpression({ expression: count })]
  }

  const onChange = (value) => {
    const valueUpdated = value
    const validations = NodeDef.getValidations(nodeDef)
    const validationsUpdated = NodeDefValidations.assocCountProp(countType)(valueUpdated)(validations)
    Actions.setProp({
      state,
      key: NodeDef.keysPropsAdvanced.validations,
      value: validationsUpdated,
    })
  }

  const determineValueType = useCallback(() => {
    const count = A.pipe(NodeDef.getValidations, NodeDefValidations.getCountProp(countType))(nodeDef)
    return Objects.isEmpty(count) || !Array.isArray(count) ? ValueType.constant : ValueType.expression
  }, [countType, nodeDef])

  return (
    <div>
      <NodeDefExpressionsProp
        qualifier={TestId.nodeDefDetails[`${countType}Count`]}
        state={state}
        Actions={Actions}
        isBoolean={false}
        label={`nodeDefEdit:validationsProps.${countType}Count`}
        onChange={onChange}
        readOnly={readOnly}
        propName={`validations.${countType}`}
        propExtractor={countPropExtractor(countType)}
        nodeDefUuidContext={nodeDefUuidContext}
        excludeCurrentNodeDef
        valueTypeSelection
        determineValueType={determineValueType}
        valueConstantEditorNumberFormat={countPropNumberFormat}
        radioMode={false}
      />
    </div>
  )
}

type RequiredPropProps = {
  Actions: Record<string, any>
  nodeDefUuidContext: string
  nodeDefValidations?: Record<string, any>
  onValidationsUpdate: (...args: any[]) => any
  readOnly?: boolean
  state: Record<string, any>
}

const RequiredProp = (props: RequiredPropProps) => {
  const { nodeDefUuidContext, nodeDefValidations, onValidationsUpdate, readOnly, state, Actions } = props

  const onRadioModeChange = useCallback(
    (mode) => {
      // the three modes are exclusive: "required if" expressions are added through the expressions editor
      const validationsWithoutRequiredIf = NodeDefValidations.dissocRequiredIf(nodeDefValidations)
      onValidationsUpdate(
        mode === requiredRadioModes.always
          ? NodeDefValidations.assocRequired(true)(validationsWithoutRequiredIf)
          : NodeDefValidations.dissocRequired(validationsWithoutRequiredIf)
      )
    },
    [nodeDefValidations, onValidationsUpdate]
  )

  const onRequiredIfUpdate = useCallback(
    (expressions) =>
      onValidationsUpdate(
        NodeDefValidations.assocRequiredIf(expressions)(NodeDefValidations.dissocRequired(nodeDefValidations))
      ),
    [nodeDefValidations, onValidationsUpdate]
  )

  return (
    <NodeDefExpressionsProp
      Actions={Actions}
      determineRadioMode={determineRequiredRadioMode}
      excludeCurrentNodeDef
      isContextParent
      isRadioModeDisabled={() => readOnly}
      label="common.required"
      nodeDefUuidContext={nodeDefUuidContext}
      onChange={onRequiredIfUpdate}
      onRadioModeChange={onRadioModeChange}
      propExtractor={() => NodeDefValidations.getRequiredIf(nodeDefValidations)}
      propName={`${NodeDef.keysPropsAdvanced.validations}.${NodeDefValidations.keys.requiredIf}`}
      qualifier={TestId.nodeDefDetails.requiredIf}
      radioLabels={{
        [requiredRadioModes.none]: 'nodeDefEdit:validationsProps.notRequired',
        [requiredRadioModes.always]: 'nodeDefEdit:validationsProps.alwaysRequired',
        [requiredRadioModes.defined]: 'nodeDefEdit:validationsProps.requiredWhenConditionIsMet',
      }}
      radioMode
      radioModeDefined={requiredRadioModes.defined}
      radioModes={Object.values(requiredRadioModes)}
      readOnly={readOnly}
      state={state}
    />
  )
}

type ValidationsPropsProps = {
  state: Record<string, any>
  Actions: Record<string, any>
}

const ValidationsProps = (props: ValidationsPropsProps) => {
  const { state, Actions } = props

  const readOnlyLocked = useNodeDefEditReadOnly()
  const canEditSurvey = useAuthCanEditSurvey()
  const readOnly = readOnlyLocked || !canEditSurvey
  const survey = useSurvey()

  const nodeDef = useMemo(() => State.getNodeDef(state), [state])
  const nodeDefUuidContext = useMemo(() => NodeDef.getParentUuid(nodeDef), [nodeDef])
  const nodeDefParent = useMemo(() => Survey.getNodeDefParent(nodeDef)(survey), [nodeDef, survey])
  const nodeDefValidations = useMemo(() => NodeDef.getValidations(nodeDef), [nodeDef])

  const validation = State.getValidation(state)
  const qualifierValidationsValidation = useMemo(
    () => Validation.getFieldValidation('qualifierValidations', null)(validation),
    [validation]
  )

  const onValidationsUpdate = useCallback(
    (validations) => Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.validations, value: validations }),
    [state, Actions]
  )

  const onValidationExpressionsUpdate = useCallback(
    (expressions) => onValidationsUpdate(NodeDefValidations.assocExpressions(expressions)(nodeDefValidations)),
    [nodeDefValidations, onValidationsUpdate]
  )

  return (
    <ValidationTooltip validation={qualifierValidationsValidation}>
      <div className="form">
        {NodeDef.isMultiple(nodeDef) && (
          <>
            {countTypes.map((countType) => (
              <CountProp
                key={countType}
                Actions={Actions}
                countType={countType}
                nodeDef={nodeDef}
                nodeDefUuidContext={nodeDefUuidContext}
                readOnly={readOnly}
                state={state}
              />
            ))}
          </>
        )}
        {NodeDef.isSingle(nodeDef) && NodeDef.isAttribute(nodeDef) && !NodeDef.isKey(nodeDef) && (
          <RequiredProp
            Actions={Actions}
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefValidations={nodeDefValidations}
            onValidationsUpdate={onValidationsUpdate}
            readOnly={readOnly}
            state={state}
          />
        )}
        {NodeDef.isSingle(nodeDef) && NodeDef.isEntity(nodeDef) && (
          <FormItem label="common.required">
            <Checkbox
              checked={NodeDefValidations.isRequired(nodeDefValidations)}
              disabled={readOnly}
              onChange={(checked) => onValidationsUpdate(NodeDefValidations.assocRequired(checked)(nodeDefValidations))}
            />
          </FormItem>
        )}
        {NodeDef.isAttribute(nodeDef) &&
          !NodeDef.isKey(nodeDef) &&
          (NodeDef.isRoot(nodeDefParent) || NodeDef.isMultiple(nodeDefParent) || NodeDef.isMultiple(nodeDef)) && (
            <FormItem isInfoMarkdown info="nodeDefEdit:unique.info" label="nodeDefEdit:unique.label">
              <Checkbox
                id={TestId.nodeDefDetails.nodeDefUnique}
                checked={NodeDefValidations.isUnique(nodeDefValidations)}
                disabled={readOnly}
                onChange={(checked) => onValidationsUpdate(NodeDefValidations.assocUnique(checked)(nodeDefValidations))}
              />
            </FormItem>
          )}
        {NodeDef.isAttribute(nodeDef) && (
          <NodeDefExpressionsProp
            Actions={Actions}
            excludeCurrentNodeDef={false}
            isBoolean={false}
            label="nodeDefEdit:validationsProps.expressions"
            nodeDefUuidContext={nodeDefUuidContext}
            onChange={onValidationExpressionsUpdate}
            propExtractor={() => NodeDefValidations.getExpressions(nodeDefValidations)}
            propName={`${NodeDef.keysPropsAdvanced.validations}.${NodeDefValidations.keys.expressions}`}
            qualifier={TestId.nodeDefDetails.validations}
            radioLabels={{
              none: 'nodeDefEdit:validationsProps.attributeAlwaysValid',
              defined: 'nodeDefEdit:validationsProps.attributeValidWhenConditionIsMet',
            }}
            readOnly={readOnly}
            severity
            showLabels
            state={state}
          />
        )}
      </div>
    </ValidationTooltip>
  )
}

export default ValidationsProps
