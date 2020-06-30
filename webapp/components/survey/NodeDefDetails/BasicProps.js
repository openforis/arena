import React from 'react'
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

import { useBasicProps } from './store'

import CodeProps from './CodeProps'
import TaxonProps from './TaxonProps'

const BasicProps = (props) => {
  const { nodeDefState, actions, editingFromDesigner } = props

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
    cyclesKeysParent,
    entitySourceHierarchy,
    renderType,
    displayIn,
    cyclesNodeDef,
  } = useBasicProps(props)

  return (
    <div className="form">
      {NodeDef.isAnalysis(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.analysis')}>
          <Checkbox checked disabled />
        </FormItem>
      )}

      <LabelsEditor
        labels={NodeDef.getLabels(nodeDef)}
        onChange={(labels) => actions.setProp({ key: NodeDef.propKeys.labels, value: labels })}
      />

      <LabelsEditor
        formLabelKey="common.description"
        labels={NodeDef.getDescriptions(nodeDef)}
        onChange={(descriptions) => actions.setProp({ key: NodeDef.propKeys.descriptions, value: descriptions })}
      />

      {NodeDef.isCode(nodeDef) && <CodeProps nodeDefState={nodeDefState} actions={actions} />}

      {NodeDef.isTaxon(nodeDef) && <TaxonProps nodeDefState={nodeDefState} actions={actions} />}

      {NodeDef.canNodeDefBeKey(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.key')}>
          <Checkbox
            checked={NodeDef.isKey(nodeDef)}
            disabled={keyEditDisabled}
            onChange={(value) => actions.setProp({ key: NodeDef.propKeys.key, value })}
          />
        </FormItem>
      )}

      {NodeDef.canNodeDefBeMultiple(nodeDef) && !NodeDef.isVirtual(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.multiple')}>
          <Checkbox
            checked={NodeDef.isMultiple(nodeDef)}
            disabled={multipleEditDisabled}
            onChange={(value) => actions.setProp({ key: NodeDef.propKeys.multiple, value })}
          />
        </FormItem>
      )}

      {displayAsEnabled && editingFromDesigner && (
        <FormItem label={i18n.t('nodeDefEdit.basicProps.displayAs')}>
          <ButtonGroup
            selectedItemKey={renderType}
            onChange={(value) => actions.setLayoutProp({ key: NodeDefLayout.keys.renderType, value })}
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
              actions.setLayoutProp(
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
          onChange={(cycles) => actions.setProp({ key: NodeDef.propKeys.cycles, value: cycles })}
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
              onChange={(uuid) => actions.setParentUuid({ parentUuid: uuid })}
            />
          </FormItem>
          <NodeDefExpressionsProp
            nodeDefState={nodeDefState}
            actions={actions}
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
  actions: PropTypes.object.isRequired,
  editingFromDesigner: PropTypes.bool.isRequired,
}

export default BasicProps
