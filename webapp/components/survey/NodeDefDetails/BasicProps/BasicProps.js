import React from 'react'
import PropTypes from 'prop-types'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { FormItem } from '@webapp/components/form/Input'
import Checkbox from '@webapp/components/form/checkbox'
import ButtonGroup from '@webapp/components/form/buttonGroup'

import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import { NodeDefExpressionsProp } from '../ExpressionsProp'

import { useBasicProps } from './store'

import { ButtonIconInfo } from '@webapp/components/buttons'

import BooleanProps from '../BooleanProps'
import CodeProps from '../CodeProps'
import CoordinateProps from '../CoordinateProps'
import DecimalProps from '../DecimalProps'
import FileProps from '../FileProps'
import TaxonProps from '../TaxonProps'
import TextProps from '../TextProps'
import AnalysisProps from '../AnalysisProps'

const basicPropsComponentByType = {
  [NodeDef.nodeDefType.boolean]: BooleanProps,
  [NodeDef.nodeDefType.code]: CodeProps,
  [NodeDef.nodeDefType.coordinate]: CoordinateProps,
  [NodeDef.nodeDefType.decimal]: DecimalProps,
  [NodeDef.nodeDefType.file]: FileProps,
  [NodeDef.nodeDefType.taxon]: TaxonProps,
  [NodeDef.nodeDefType.text]: TextProps,
}

const BasicProps = (props) => {
  const { state, Actions, editingFromDesigner } = props

  const i18n = useI18n()

  const {
    nodeDef,
    validation,
    displayAsEnabled,
    displayInEnabled,
    displayAsTableDisabled,
    displayInParentPageDisabled,
    keyEditDisabled,
    multipleEditDisabled,
    entitySourceHierarchy,
    renderType,
    displayIn,
    nodeDefParentLabel,
    enumerator,
    cyclesNodeDef,
    cyclesKeysParent,
  } = useBasicProps(props)

  return (
    <div className="form">
      <LabelsEditor
        inputFieldIdPrefix={TestId.nodeDefDetails.nodeDefLabels('')}
        labels={NodeDef.getLabels(nodeDef)}
        onChange={(labels) => Actions.setProp({ state, key: NodeDef.propKeys.labels, value: labels })}
      />

      <LabelsEditor
        formLabelKey="common.description"
        inputFieldIdPrefix={TestId.nodeDefDetails.nodeDefDescriptions('')}
        labels={NodeDef.getDescriptions(nodeDef)}
        onChange={(descriptions) => Actions.setProp({ state, key: NodeDef.propKeys.descriptions, value: descriptions })}
      />

      {NodeDef.canNodeDefBeKey(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.key')}>
          <div className="form-item_body">
            <Checkbox
              id={TestId.nodeDefDetails.nodeDefKey}
              checked={NodeDef.isKey(nodeDef)}
              disabled={keyEditDisabled}
              onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.key, value })}
            />
            {enumerator && (
              <span>
                {i18n.t('nodeDefEdit.basicProps.enumerator.label')}
                <ButtonIconInfo title="nodeDefEdit.basicProps.enumerator.info" />
              </span>
            )}
          </div>
        </FormItem>
      )}

      {NodeDef.canNodeDefBeMultiple(nodeDef) && !NodeDef.isVirtual(nodeDef) && (
        <>
          <FormItem label={i18n.t('nodeDefEdit.basicProps.multiple')}>
            <div className="form-item_body">
              <Checkbox
                id={TestId.nodeDefDetails.nodeDefMultiple}
                checked={NodeDef.isMultiple(nodeDef)}
                disabled={multipleEditDisabled}
                onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.multiple, value })}
              />
              {NodeDef.isMultipleEntity(nodeDef) && (
                <FormItem
                  label={
                    <span>
                      {i18n.t('nodeDefEdit.basicProps.enumerate.label')}
                      <ButtonIconInfo title="nodeDefEdit.basicProps.enumerate.info" />
                    </span>
                  }
                >
                  <div>
                    <Checkbox
                      id={TestId.nodeDefDetails.nodeDefEnumerate}
                      checked={NodeDef.isEnumerate(nodeDef)}
                      onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.enumerate, value })}
                    />
                  </div>
                </FormItem>
              )}
            </div>
          </FormItem>
        </>
      )}

      {NodeDef.getType(nodeDef) in basicPropsComponentByType &&
        React.createElement(basicPropsComponentByType[NodeDef.getType(nodeDef)], { Actions, state })}

      {displayAsEnabled && editingFromDesigner && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.displayAs')}>
          <ButtonGroup
            selectedItemKey={renderType}
            onChange={(value) => Actions.setLayoutProp({ state, key: NodeDefLayout.keys.renderType, value })}
            items={[
              {
                key: NodeDefLayout.renderType.form,
                label: i18n.t('nodeDefEdit.basicProps.form'),
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

      {displayInEnabled && editingFromDesigner && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.displayIn')}>
          <ButtonGroup
            selectedItemKey={displayIn}
            onChange={(value) =>
              Actions.setLayoutProp({
                state,
                key: NodeDefLayout.keys.pageUuid,
                value: value === NodeDefLayout.displayIn.parentPage ? null : uuidv4(),
              })
            }
            items={[
              {
                key: NodeDefLayout.displayIn.parentPage,
                label: i18n.t('nodeDefEdit.basicProps.parentPage', { parentPage: nodeDefParentLabel }),
                disabled: displayInParentPageDisabled,
              },
              {
                key: NodeDefLayout.displayIn.ownPage,
                label: i18n.t('nodeDefEdit.basicProps.ownPage'),
              },
            ]}
          />
        </FormItem>
      )}

      <CyclesSelector
        cyclesKeysSelectable={cyclesKeysParent}
        cyclesKeysSelected={cyclesNodeDef}
        disabled={NodeDef.isRoot(nodeDef) || !editingFromDesigner || cyclesKeysParent.length <= 1}
        onChange={(cycles) => Actions.setProp({ state, key: NodeDef.propKeys.cycles, value: cycles })}
      >
        <Checkbox
          checked={NodeDef.isIncludedWhenCloningBetweenCycles(nodeDef)}
          disabled={NodeDef.isAlwaysIncludedWhenCloningBetweenCycles(nodeDef)}
          label="nodeDefEdit.basicProps.includedWhenCloningBetweenCycles"
          onChange={(value) =>
            Actions.setProp({ state, key: NodeDef.propKeys.includedWhenCloningBetweenCycles, value })
          }
        />
      </CyclesSelector>

      {NodeDef.isVirtual(nodeDef) && (
        <>
          <FormItem label={i18n.t('nodeDefEdit.basicProps.entitySource')}>
            <EntitySelector
              hierarchy={entitySourceHierarchy}
              nodeDefUuidEntity={NodeDef.getParentUuid(nodeDef)}
              validation={Validation.getFieldValidation(NodeDef.keys.parentUuid)(validation)}
              onChange={(uuid) => Actions.setParentUuid({ state, parentUuid: uuid })}
            />
          </FormItem>
          <NodeDefExpressionsProp
            qualifier={TestId.nodeDefDetails.formula}
            state={state}
            Actions={Actions}
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

      {NodeDef.isAnalysis(nodeDef) && <AnalysisProps state={state} Actions={Actions} nodeDef={nodeDef} />}
    </div>
  )
}

BasicProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
  editingFromDesigner: PropTypes.bool.isRequired,
}

export default BasicProps
