import React from 'react'
import * as R from 'ramda'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'
import LabelsEditor from '../../labelsEditor'
import CodeListProps from './codeListProps'
import TaxonProps from './taxonProps'

import { getFieldValidation, getValidation } from './../../../../../common/validation/validator'

import {
  canNodeDefBeMultiple,
  getNodeDefDescriptions,
  getNodeDefLabels,
  getNodeDefName,
  isNodeDefCodeList,
  isNodeDefTaxon,
  isNodeDefEntity,
  isNodeDefKey,
  isNodeDefMultiple,
} from '../../../../../common/survey/nodeDef'

import { isRenderTable, } from '../../../../../common/survey/nodeDefLayout'

import { normalizeName } from './../../../../../common/survey/surveyUtils'

const onPropLabelsChange = (putNodeDefProp, nodeDef, labelItem, key, currentValue) => {
  putNodeDefProp(nodeDef, key, R.assoc(labelItem.lang, labelItem.label, currentValue))
}

const CommonProps = props => {
  const {nodeDef, putNodeDefProp} = props
  const validation = getValidation(nodeDef)

  return (
    <React.Fragment>
      <FormItem label={'name'}>
        <Input value={getNodeDefName(nodeDef)}
               validation={getFieldValidation('name')(validation)}
               onChange={e => putNodeDefProp(nodeDef, 'name', normalizeName(e.target.value))}/>
      </FormItem>

      <FormItem label={'type'}>
        <label>{nodeDef.type}</label>
      </FormItem>

      <LabelsEditor labels={getNodeDefLabels(nodeDef)}
                    onChange={(labelItem) => onPropLabelsChange(putNodeDefProp, nodeDef, labelItem, 'labels', getNodeDefLabels(nodeDef))}/>

      <LabelsEditor formLabel="Description(s)"
                    labels={getNodeDefDescriptions(nodeDef)}
                    onChange={(labelItem) => onPropLabelsChange(putNodeDefProp, nodeDef, labelItem, 'descriptions', getNodeDefDescriptions(nodeDef))}/>

      {
        isNodeDefCodeList(nodeDef) &&
          <CodeListProps {...props} />
      }

      {
        isNodeDefTaxon(nodeDef) &&
          <TaxonProps {...props} />
      }

      {
        isNodeDefEntity(nodeDef)
          ? null
          : <FormItem label={'key'}>
            <Checkbox checked={isNodeDefKey(nodeDef)}
                      onChange={(checked) => putNodeDefProp(nodeDef, 'key', checked)}/>
          </FormItem>
      }

      {
        canNodeDefBeMultiple(nodeDef)
          ? <FormItem label={'multiple'}>
            <Checkbox checked={isNodeDefMultiple(nodeDef)}
                      disabled={isRenderTable(nodeDef)}
                      onChange={(checked) => putNodeDefProp(nodeDef, 'multiple', checked)}/>
          </FormItem>
          : null
      }

    </React.Fragment>
  )
}

export default CommonProps