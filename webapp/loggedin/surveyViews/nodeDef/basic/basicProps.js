import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/input'
import Checkbox from '@webapp/components/form/checkbox'
import ButtonGroup from '@webapp/components/form/buttonGroup'

import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import NodeDefExpressionsProp from '@webapp/loggedin/surveyViews/nodeDef/advanced/expressionsProp/nodeDefExpressionsProp'

import * as NodeDefState from '../store/nodeDefState'
import { useActions } from '../store/actions/index'

import CodeProps from './codeProps'
import TaxonProps from './taxonProps'

const BasicProps = (props) => {
  const {
    nodeDefState,
    setNodeDefState,
    nodeDefKeyEditDisabled,
    nodeDefMultipleEditDisabled,
    editingNodeDefFromDesigner,
  } = props

  const dispatch = useDispatch()

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()

  const i18n = useI18n()

  const { setNodeDefProp, setNodeDefLayoutProp, setNodeDefParentUuid } = useActions({ nodeDefState, setNodeDefState })

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)

  const isEntityAndNotRoot = NodeDef.isEntity(nodeDef) && !NodeDef.isRoot(nodeDef)
  const displayAsEnabled = isEntityAndNotRoot
  const displayInEnabled = isEntityAndNotRoot
  const displayAsFormDisabled = false
  const displayAsTableDisabled = Survey.hasNodeDefChildrenEntities(nodeDef)(survey) || NodeDef.isSingle(nodeDef)

  const displayInParentPageDisabled = NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)
  const displayInOwnPageDisabled = false

  // Survey cycles
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const cyclesKeysSurvey = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)
  const cyclesKeysParent = NodeDef.isRoot(nodeDef) ? cyclesKeysSurvey : NodeDef.getCycles(nodeDefParent)

  // Analysis
  const entitySourceHierarchy = Survey.getHierarchy(
    (nodeDefCurrent) => NodeDef.isEntity(nodeDefCurrent) && !NodeDef.isAnalysis(nodeDefCurrent),
    true
  )(survey)

  const renderType = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)
  const displayIn = NodeDefLayout.getDisplayIn(surveyCycleKey)(nodeDef)
  const cyclesNodeDef = NodeDef.getCycles(nodeDef)

  return (
    <div className="form">
      {NodeDef.isAnalysis(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.analysis')}>
          <Checkbox checked disabled />
        </FormItem>
      )}

      <LabelsEditor
        labels={NodeDef.getLabels(nodeDef)}
        onChange={(labels) => dispatch(setNodeDefProp(NodeDef.propKeys.labels, labels))}
      />

      <LabelsEditor
        formLabelKey="common.description"
        labels={NodeDef.getDescriptions(nodeDef)}
        onChange={(descriptions) => dispatch(setNodeDefProp(NodeDef.propKeys.descriptions, descriptions))}
      />

      {NodeDef.isCode(nodeDef) && <CodeProps nodeDefState={nodeDefState} setNodeDefState={setNodeDefState} />}

      {NodeDef.isTaxon(nodeDef) && <TaxonProps nodeDefState={nodeDefState} setNodeDefState={setNodeDefState} />}

      {NodeDef.canNodeDefBeKey(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.key')}>
          <Checkbox
            checked={NodeDef.isKey(nodeDef)}
            disabled={nodeDefKeyEditDisabled}
            onChange={(checked) => dispatch(setNodeDefProp(NodeDef.propKeys.key, checked))}
          />
        </FormItem>
      )}

      {NodeDef.canNodeDefBeMultiple(nodeDef) && !NodeDef.isVirtual(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.multiple')}>
          <Checkbox
            checked={NodeDef.isMultiple(nodeDef)}
            disabled={nodeDefMultipleEditDisabled}
            onChange={(checked) => dispatch(setNodeDefProp(NodeDef.propKeys.multiple, checked))}
          />
        </FormItem>
      )}

      {displayAsEnabled && editingNodeDefFromDesigner && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.displayAs')}>
          <ButtonGroup
            selectedItemKey={renderType}
            onChange={(value) => dispatch(setNodeDefLayoutProp(NodeDefLayout.keys.renderType, value))}
            items={[
              {
                key: NodeDefLayout.renderType.form,
                label: i18n.t('nodeDefEdit.basicProps.form'),
                disabled: displayAsFormDisabled,
              },
              {
                key: NodeDefLayout.renderType.table,
                label: i18n.t('nodeDefEdit.basicProps.table'),
                disabled: displayAsTableDisabled,
              },
            ]}
          />
        </FormItem>
      )}

      {displayInEnabled && editingNodeDefFromDesigner && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.displayIn')}>
          <ButtonGroup
            selectedItemKey={displayIn}
            onChange={(value) =>
              dispatch(
                setNodeDefLayoutProp(
                  NodeDefLayout.keys.pageUuid,
                  value === NodeDefLayout.displayIn.parentPage ? null : uuidv4()
                )
              )
            }
            items={[
              {
                key: NodeDefLayout.displayIn.parentPage,
                label: i18n.t('nodeDefEdit.basicProps.parentPage'),
                disabled: displayInParentPageDisabled,
              },
              {
                key: NodeDefLayout.displayIn.ownPage,
                label: i18n.t('nodeDefEdit.basicProps.ownPage'),
                disabled: displayInOwnPageDisabled,
              },
            ]}
          />
        </FormItem>
      )}

      {cyclesKeysParent.length > 1 && (
        <CyclesSelector
          cyclesKeysSelectable={cyclesKeysParent}
          cyclesKeysSelected={cyclesNodeDef}
          disabled={NodeDef.isRoot(nodeDef) || !editingNodeDefFromDesigner}
          onChange={(cycles) => dispatch(setNodeDefProp(NodeDef.propKeys.cycles, cycles))}
        />
      )}

      {NodeDef.isVirtual(nodeDef) && (
        <>
          <FormItem label={i18n.t('nodeDefEdit.basicProps.entitySource')}>
            <EntitySelector
              hierarchy={entitySourceHierarchy}
              nodeDefUuidEntity={NodeDef.getParentUuid(nodeDef)}
              lang={i18n.lang}
              validation={Validation.getFieldValidation(NodeDef.keys.parentUuid)(validation)}
              onChange={(uuid) => dispatch(setNodeDefParentUuid(uuid))}
            />
          </FormItem>
          <NodeDefExpressionsProp
            nodeDef={nodeDef}
            nodeDefValidation={validation}
            setNodeDefProp={setNodeDefProp}
            label={i18n.t('nodeDefEdit.basicProps.formula')}
            propName={NodeDef.keysPropsAdvanced.formula}
            applyIf={false}
            multiple={false}
            nodeDefUuidContext={NodeDef.getUuid(nodeDef)}
            isContextParent={false}
            hideAdvanced
          />
        </>
      )}
    </div>
  )
}

BasicProps.propTypes = {
  nodeDefState: PropTypes.object.isRequired,
  setNodeDefState: PropTypes.func.isRequired,
  nodeDefKeyEditDisabled: PropTypes.bool.isRequired,
  nodeDefMultipleEditDisabled: PropTypes.bool.isRequired,
  editingNodeDefFromDesigner: PropTypes.bool.isRequired,
}

export default BasicProps
