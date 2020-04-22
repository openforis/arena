import React from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Validation from '@core/validation/validation'

import { uuidv4 } from '@core/uuid'
import { normalizeName } from '@core/stringUtils'

import { useI18n } from '@webapp/commonComponents/hooks'
import { FormItem, Input } from '@webapp/commonComponents/form/input'
import Checkbox from '@webapp/commonComponents/form/checkbox'
import ButtonGroup from '@webapp/commonComponents/form/buttonGroup'
import EntitySelector from '@webapp/loggedin/surveyViews/nodeDefsSelector/components/entitySelector'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'
import CyclesSelect from '@webapp/loggedin/surveyViews/cyclesSelect/cyclesSelect'
import NodeDefExpressionsProp from '@webapp/loggedin/surveyViews/nodeDef/advanced/expressionsProp/nodeDefExpressionsProp'
import * as SurveyState from '@webapp/survey/surveyState'
import CodeProps from './codeProps'
import TaxonProps from './taxonProps'

import * as NodeDefState from '../nodeDefState'

const BasicProps = (props) => {
  const {
    validation,
    nodeDefKeyEditDisabled,
    nodeDefMultipleEditDisabled,
    editingNodeDefFromDesigner,

    setNodeDefParentUuid,
    setNodeDefProp,
    setNodeDefLayoutProp,
  } = props

  const survey = useSelector(SurveyState.getSurvey)
  const surveyCycleKey = useSelector(SurveyState.getSurveyCycleKey)
  const nodeDef = useSelector(NodeDefState.getNodeDef)

  const i18n = useI18n()

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
      <FormItem label={i18n.t('common.type')}>
        <p>{nodeDef.type}</p>
      </FormItem>

      {NodeDef.isAnalysis(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.analysis')}>
          <Checkbox checked disabled />
        </FormItem>
      )}

      <FormItem label={i18n.t('common.name')}>
        <Input
          value={NodeDef.getName(nodeDef)}
          validation={Validation.getFieldValidation(NodeDef.propKeys.name)(validation)}
          onChange={(value) => setNodeDefProp(NodeDef.propKeys.name, normalizeName(value))}
        />
      </FormItem>

      <LabelsEditor
        labels={NodeDef.getLabels(nodeDef)}
        onChange={(labels) => setNodeDefProp(NodeDef.propKeys.labels, labels)}
      />

      <LabelsEditor
        formLabelKey="common.description"
        labels={NodeDef.getDescriptions(nodeDef)}
        onChange={(descriptions) => setNodeDefProp(NodeDef.propKeys.descriptions, descriptions)}
      />

      {NodeDef.isCode(nodeDef) && (
        <CodeProps
          surveyCycleKey={surveyCycleKey}
          nodeDef={nodeDef}
          validation={validation}
          setNodeDefProp={setNodeDefProp}
          setNodeDefLayoutProp={setNodeDefLayoutProp}
        />
      )}

      {NodeDef.isTaxon(nodeDef) && (
        <TaxonProps nodeDef={nodeDef} validation={validation} setNodeDefProp={setNodeDefProp} />
      )}

      {NodeDef.canNodeDefBeKey(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.key')}>
          <Checkbox
            checked={NodeDef.isKey(nodeDef)}
            disabled={nodeDefKeyEditDisabled}
            onChange={(checked) => setNodeDefProp(NodeDef.propKeys.key, checked)}
          />
        </FormItem>
      )}

      {NodeDef.canNodeDefBeMultiple(nodeDef) && !NodeDef.isVirtual(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.multiple')}>
          <Checkbox
            checked={NodeDef.isMultiple(nodeDef)}
            disabled={nodeDefMultipleEditDisabled}
            onChange={(checked) => setNodeDefProp(NodeDef.propKeys.multiple, checked)}
          />
        </FormItem>
      )}

      {displayAsEnabled && editingNodeDefFromDesigner && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.displayAs')}>
          <ButtonGroup
            selectedItemKey={renderType}
            onChange={(value) => setNodeDefLayoutProp(NodeDefLayout.keys.renderType, value)}
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
              setNodeDefLayoutProp(
                NodeDefLayout.keys.pageUuid,
                value === NodeDefLayout.displayIn.parentPage ? null : uuidv4()
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
        <CyclesSelect
          cyclesKeysSelectable={cyclesKeysParent}
          cyclesKeysSelected={cyclesNodeDef}
          disabled={NodeDef.isRoot(nodeDef) || !editingNodeDefFromDesigner}
          onChange={(cycles) => setNodeDefProp(NodeDef.propKeys.cycles, cycles)}
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
              onChange={(uuid) => setNodeDefParentUuid(uuid)}
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
  validation: PropTypes.object.isRequired,
  nodeDefKeyEditDisabled: PropTypes.bool.isRequired,
  nodeDefMultipleEditDisabled: PropTypes.bool.isRequired,
  editingNodeDefFromDesigner: PropTypes.bool.isRequired,

  setNodeDefParentUuid: PropTypes.func.isRequired,
  setNodeDefProp: PropTypes.func.isRequired,
  setNodeDefLayoutProp: PropTypes.func.isRequired,
}

export default BasicProps
