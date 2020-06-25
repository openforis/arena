import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/input'
import Checkbox from '@webapp/components/form/checkbox'
import ButtonGroup from '@webapp/components/form/buttonGroup'

import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import { NodeDefExpressionsProp } from './ExpressionsProp'

import { useActions, useBasicProps } from './store'

import CodeProps from './CodeProps'
import TaxonProps from './TaxonProps'

const BasicProps = (props) => {
  const { nodeDefState, setNodeDefState, keyEditDisabled, multipleEditDisabled, editingFromDesigner } = props

  const dispatch = useDispatch()
  const i18n = useI18n()

  const {
    surveyCycleKey,
    nodeDef,
    validation,
    displayAsEnabled,
    displayInEnabled,
    displayAsFormDisabled,
    displayAsTableDisabled,
    displayInParentPageDisabled,
    displayInOwnPageDisabled,
    cyclesKeysParent,
    entitySourceHierarchy,
    renderType,
    displayIn,
    cyclesNodeDef,
  } = useBasicProps(props)

  const { setNodeDefProp, setNodeDefLayoutProp, setNodeDefParentUuid } = useActions({ nodeDefState, setNodeDefState })

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
            disabled={keyEditDisabled}
            onChange={(checked) => dispatch(setNodeDefProp(NodeDef.propKeys.key, checked))}
          />
        </FormItem>
      )}

      {NodeDef.canNodeDefBeMultiple(nodeDef) && !NodeDef.isVirtual(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.multiple')}>
          <Checkbox
            checked={NodeDef.isMultiple(nodeDef)}
            disabled={multipleEditDisabled}
            onChange={(checked) => dispatch(setNodeDefProp(NodeDef.propKeys.multiple, checked))}
          />
        </FormItem>
      )}

      {displayAsEnabled && editingFromDesigner && (
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

      {displayInEnabled && editingFromDesigner && (
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
          disabled={NodeDef.isRoot(nodeDef) || !editingFromDesigner}
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
            setNodeDefProp={(...args) => dispatch(setNodeDefProp(...args))}
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
  keyEditDisabled: PropTypes.bool.isRequired,
  multipleEditDisabled: PropTypes.bool.isRequired,
  editingFromDesigner: PropTypes.bool.isRequired,
}

export default BasicProps
