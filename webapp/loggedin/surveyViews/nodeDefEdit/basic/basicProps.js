import React, { useContext } from 'react'
import * as R from 'ramda'

import AppContext from '../../../../app/appContext'

import { uuidv4 } from '../../../../../common/uuid'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'
import LabelsEditor from '../../labelsEditor/labelsEditor'
import CodeProps from './codeProps'
import TaxonProps from './taxonProps'

import NodeDef from '../../../../../common/survey/nodeDef'
import NodeDefLayout from '../../../../../common/survey/nodeDefLayout'
import { getFieldValidation, getValidation } from '../../../../../common/validation/validator'

import { normalizeName } from '../../../../../common/stringUtils'
import ButtonGroup from '../../../../commonComponents/form/buttonGroup'

const BasicProps = props => {
  const {
    nodeDef,
    nodeDefKeyEditDisabled, nodeDefMultipleEditDisabled,
    displayAsEnabled, displayInEnabled,
    putNodeDefProp,
    toggleTaxonomyEdit, toggleCategoryEdit
  } = props
  const validation = getValidation(nodeDef)

  const { i18n } = useContext(AppContext)

  const displayAsItems = [
    {
      key: NodeDefLayout.nodeDefRenderType.form,
      label: i18n.t('nodeDefEdit.basicProps.form'),
    },
    {
      key: NodeDefLayout.nodeDefRenderType.table,
      label: i18n.t('nodeDefEdit.basicProps.table'),
    },
  ]

  const displayInItems = [
    {
      key: NodeDefLayout.nodeDefDisplayIn.parentPage,
      label: i18n.t('nodeDefEdit.basicProps.parentPage'),
    },
    {
      key: NodeDefLayout.nodeDefDisplayIn.ownPage,
      label: i18n.t('nodeDefEdit.basicProps.ownPage'),
    },
  ]

  const onPropLabelsChange = (labelItem, key, currentValue) => {
    putNodeDefProp(nodeDef, key, R.assoc(labelItem.lang, labelItem.label, currentValue))
  }

  return (
    <div className="form">
      <FormItem label={i18n.t('nodeDefEdit.basicProps.type')}>
        <label>{nodeDef.type}</label>
      </FormItem>

      <FormItem label={i18n.t('nodeDefEdit.basicProps.name')}>
        <Input
          value={NodeDef.getName(nodeDef)}
          validation={getFieldValidation('name')(validation)}
          onChange={value => putNodeDefProp(nodeDef, 'name', normalizeName(value))}/>
      </FormItem>

      <LabelsEditor
        labels={NodeDef.getLabels(nodeDef)}
        onChange={(labelItem) => onPropLabelsChange(labelItem, 'labels', NodeDef.getLabels(nodeDef))}/>

      <LabelsEditor
        formLabel="Description(s)"
        labels={NodeDef.getDescriptions(nodeDef)}
        onChange={(labelItem) => onPropLabelsChange(labelItem, 'descriptions', NodeDef.getDescriptions(nodeDef))}/>

      {
        NodeDef.isCode(nodeDef) &&
        <CodeProps
          nodeDef={nodeDef}
          toggleCategoryEdit={toggleCategoryEdit}
          putNodeDefProp={putNodeDefProp}/>
      }

      {
        NodeDef.isTaxon(nodeDef) &&
        <TaxonProps
          nodeDef={nodeDef}
          toggleTaxonomyEdit={toggleTaxonomyEdit}
          putNodeDefProp={putNodeDefProp}/>
      }

      {
        NodeDef.canNodeDefBeKey(nodeDef) &&
        <FormItem label={i18n.t('nodeDefEdit.basicProps.key')}>
          <Checkbox
            checked={NodeDef.isKey(nodeDef)}
            disabled={nodeDefKeyEditDisabled}
            onChange={(checked) => putNodeDefProp(nodeDef, 'key', checked)}/>
        </FormItem>
      }

      {
        NodeDef.canNodeDefBeMultiple(nodeDef) &&
        <FormItem label={i18n.t('nodeDefEdit.basicProps.multiple')}>
          <Checkbox
            checked={NodeDef.isMultiple(nodeDef)}
            disabled={nodeDefMultipleEditDisabled}
            onChange={(checked) => putNodeDefProp(nodeDef, 'multiple', checked)}/>
        </FormItem>
      }

      {
        displayAsEnabled &&
        <FormItem label={i18n.t('nodeDefEdit.basicProps.displayAs')}>
          <ButtonGroup
            selectedItemKey={NodeDefLayout.getRenderType(nodeDef)}
            onChange={renderType => putNodeDefProp(nodeDef, NodeDefLayout.nodeDefLayoutProps.render, renderType)}
            items={displayAsItems}
          />
        </FormItem>
      }

      {
        displayInEnabled &&
        <FormItem label={i18n.t('nodeDefEdit.basicProps.displayIn')}>
          <ButtonGroup
            selectedItemKey={NodeDefLayout.getDisplayIn(nodeDef)}
            onChange={displayIn => putNodeDefProp(nodeDef, NodeDefLayout.nodeDefLayoutProps.pageUuid,
              displayIn === NodeDefLayout.nodeDefDisplayIn.parentPage ? null : uuidv4())}
            items={displayInItems}
          />
        </FormItem>
      }

    </div>
  )
}

export default BasicProps