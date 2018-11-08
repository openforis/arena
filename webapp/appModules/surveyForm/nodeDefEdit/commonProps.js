import React from 'react'
import * as R from 'ramda'

import { FormItem, Input } from '../../../commonComponents/form/input'
import Checkbox from '../../../commonComponents/form/checkbox'
import LabelsEditor from '../../../survey/components/labelsEditor'
import CodeListProps from './codeListProps'
import TaxonProps from './taxonProps'

import NodeDef from '../../../../common/survey/nodeDef'
import { getFieldValidation, getValidation } from '../../../../common/validation/validator'

import { isRenderTable, } from '../../../../common/survey/nodeDefLayout'

import { normalizeName } from '../../../../common/stringUtils'

const onPropLabelsChange = (putNodeDefProp, nodeDef, labelItem, key, currentValue) => {
  putNodeDefProp(nodeDef, key, R.assoc(labelItem.lang, labelItem.label, currentValue))
}

const CommonProps = props => {
  const {
    nodeDef, putNodeDefProp,
  } = props
  const validation = getValidation(nodeDef)

  return (
    <React.Fragment>
      <FormItem label={'type'}>
        <label>{nodeDef.type}</label>
      </FormItem>

      <FormItem label={'name'}>
        <Input value={NodeDef.getNodeDefName(nodeDef)}
               validation={getFieldValidation('name')(validation)}
               onChange={e => putNodeDefProp(nodeDef, 'name', normalizeName(e.target.value))}/>
      </FormItem>

      <LabelsEditor labels={NodeDef.getNodeDefLabels(nodeDef)}
                    onChange={(labelItem) => onPropLabelsChange(putNodeDefProp, nodeDef, labelItem, 'labels', NodeDef.getNodeDefLabels(nodeDef))}/>

      <LabelsEditor formLabel="Description(s)"
                    labels={NodeDef.getNodeDefDescriptions(nodeDef)}
                    onChange={(labelItem) => onPropLabelsChange(putNodeDefProp, nodeDef, labelItem, 'descriptions', NodeDef.getNodeDefDescriptions(nodeDef))}/>

      {
        NodeDef.isNodeDefCodeList(nodeDef) &&
        <CodeListProps nodeDef={nodeDef}
                       toggleCodeListEdit={toggleCodeListEdit}
                       putNodeDefProp={putNodeDefProp}/>
      }

      {
        NodeDef.isNodeDefTaxon(nodeDef) &&
        <TaxonProps nodeDef={nodeDef}
                    toggleTaxonomyEdit={toggleTaxonomyEdit}
                    putNodeDefProp={putNodeDefProp}/>
      }

      {
        !NodeDef.isNodeDefEntity(nodeDef) &&
        <FormItem label={'key'}>
          <Checkbox checked={NodeDef.isNodeDefKey(nodeDef)}
                    onChange={(checked) => putNodeDefProp(nodeDef, 'key', checked)}/>
        </FormItem>
      }

      {
        NodeDef.canNodeDefBeMultiple(nodeDef) &&
        <FormItem label={'multiple'}>
          <Checkbox checked={NodeDef.isNodeDefMultiple(nodeDef)}
                    disabled={isRenderTable(nodeDef)}
                    onChange={(checked) => putNodeDefProp(nodeDef, 'multiple', checked)}/>
        </FormItem>
      }

    </React.Fragment>
  )
}

export default CommonProps