import React from 'react'
import * as R from 'ramda'

import { uuidv4 } from '../../../../../common/uuid'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'
import LabelsEditor from '../../../../survey/components/labelsEditor'
import CodeProps from './codeProps'
import TaxonProps from './taxonProps'

import NodeDef from '../../../../../common/survey/nodeDef'
import NodeDefLayout from '../../../../../common/survey/nodeDefLayout'
import { getFieldValidation, getValidation } from '../../../../../common/validation/validator'

import { normalizeName } from '../../../../../common/stringUtils'
import ButtonGroup from '../../../../commonComponents/form/buttonGroup'

const displayAsItems = [
  {
    key: NodeDefLayout.nodeDefRenderType.form,
    label: 'Form'
  },
  {
    key: NodeDefLayout.nodeDefRenderType.table,
    label: 'Table'
  }
]

const displayInItems = [
  {
    key: NodeDefLayout.nodeDefDisplayIn.parentPage,
    label: 'Parent page'
  },
  {
    key: NodeDefLayout.nodeDefDisplayIn.ownPage,
    label: 'Its own page'
  }
]

const onPropLabelsChange = (putNodeDefProp, nodeDef, labelItem, key, currentValue) => {
  putNodeDefProp(nodeDef, key, R.assoc(labelItem.lang, labelItem.label, currentValue))
}

const BasicProps = props => {
  const {
    nodeDef,
    nodeDefKeyEditDisabled, nodeDefMultipleEditDisabled,
    displayAsEnabled, displayInEnabled,
    putNodeDefProp,
    toggleTaxonomyEdit, toggleCategoryEdit
  } = props
  const validation = getValidation(nodeDef)

  return (
    <div className="form">
      <FormItem label={'type'}>
        <label>{nodeDef.type}</label>
      </FormItem>

      <FormItem label={'name'}>
        <Input
          value={NodeDef.getNodeDefName(nodeDef)}
          validation={getFieldValidation('name')(validation)}
          onChange={value => putNodeDefProp(nodeDef, 'name', normalizeName(value))}/>
      </FormItem>

      <LabelsEditor
        labels={NodeDef.getNodeDefLabels(nodeDef)}
        onChange={(labelItem) => onPropLabelsChange(putNodeDefProp, nodeDef, labelItem, 'labels', NodeDef.getNodeDefLabels(nodeDef))}/>

      <LabelsEditor
        formLabel="Description(s)"
        labels={NodeDef.getNodeDefDescriptions(nodeDef)}
        onChange={(labelItem) => onPropLabelsChange(putNodeDefProp, nodeDef, labelItem, 'descriptions', NodeDef.getNodeDefDescriptions(nodeDef))}/>

      {
        NodeDef.isNodeDefCode(nodeDef) &&
        <CodeProps
          nodeDef={nodeDef}
          toggleCategoryEdit={toggleCategoryEdit}
          putNodeDefProp={putNodeDefProp}/>
      }

      {
        NodeDef.isNodeDefTaxon(nodeDef) &&
        <TaxonProps
          nodeDef={nodeDef}
          toggleTaxonomyEdit={toggleTaxonomyEdit}
          putNodeDefProp={putNodeDefProp}/>
      }

      {
        NodeDef.canNodeDefBeKey(nodeDef) &&
        <FormItem label={'key'}>
          <Checkbox
            checked={NodeDef.isNodeDefKey(nodeDef)}
            disabled={nodeDefKeyEditDisabled}
            onChange={(checked) => putNodeDefProp(nodeDef, 'key', checked)}/>
        </FormItem>
      }

      {
        NodeDef.canNodeDefBeMultiple(nodeDef) &&
        <FormItem label={'multiple'}>
          <Checkbox
            checked={NodeDef.isNodeDefMultiple(nodeDef)}
            disabled={nodeDefMultipleEditDisabled}
            onChange={(checked) => putNodeDefProp(nodeDef, 'multiple', checked)}/>
        </FormItem>
      }

      {
        displayAsEnabled &&
        <FormItem label={'display as'}>
          <ButtonGroup
            selectedItemKey={NodeDefLayout.getRenderType(nodeDef)}
            onChange={renderType => putNodeDefProp(nodeDef, NodeDefLayout.nodeDefLayoutProps.render, renderType)}
            items={displayAsItems}
          />
        </FormItem>
      }

      {
        displayInEnabled &&
        <FormItem label={'display in'}>
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