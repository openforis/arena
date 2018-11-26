import './defaultValues.scss'

import React from 'react'
import * as R from 'ramda'

import { Input } from '../../../commonComponents/form/input'

import NodeDef from '../../../../common/survey/nodeDef'
import DefaultValue from '../../../../common/survey/defaultValue'

const DefaultValueRow = ({defaultValue, onUpdate, onDelete, readOnly}) =>
  <div className="table__row">
    <div>
      <Input value={DefaultValue.getExpression(defaultValue)}
             onValueChange={value => onUpdate(DefaultValue.setExpression(value)(defaultValue))}/>
    </div>
    <div>
      <Input value={DefaultValue.getApplyIf(defaultValue)}
             onValueChange={value => onUpdate(DefaultValue.setApplyIf(value)(defaultValue))}/>
    </div>
    <div>
      {!defaultValue.placeholder &&
      <button className="btn btn-of-light"
              aria-disabled={readOnly}
              onClick={() => onDelete(defaultValue)}>
        <span className="icon icon-cross icon-14px"/>
      </button>
      }
    </div>
  </div>

const onDefaultValueUpdate = (nodeDef, defaultValues, defaultValue, putNodeDefProp) => {
  const updatedDefaultValue = R.dissoc('placeholder', defaultValue)
  const newDefaultValues = R.pipe(
    R.update(R.findIndex(R.propEq('uuid', defaultValue.uuid))(defaultValues), updatedDefaultValue),
    R.reject(R.propEq('placeholder', true)),
  )(defaultValues)
  putNodeDefProp(nodeDef, 'defaultValues', newDefaultValues, true)
}

const onDefaultValueDelete = (nodeDef, defaultValues, defaultValue, putNodeDefProp) => {
  if (window.confirm('Delete this default value?')) {
    const newDefaultValues = R.pipe(
      R.remove(R.findIndex(R.propEq('uuid', defaultValue.uuid))(defaultValues), 1),
      R.reject(R.propEq('placeholder', true)),
    )(defaultValues)
    putNodeDefProp(nodeDef, 'defaultValues', newDefaultValues, true)
  }
}

const DefaultValues = props => {
  const {
    nodeDef,
    putNodeDefProp,
  } = props
  //const validation = getValidation(nodeDef)

  const defaultValues = NodeDef.getDefaultValues(nodeDef)
  const uiDefaultValues = R.append(DefaultValue.createDefaultValuePlaceholder(), defaultValues)

  return (
    <div className="table default-values">
      <div className="table__row-header">
        <div>Value</div>
        <div>If</div>
        <div></div>
      </div>
      <div className="table__rows">
        {
          uiDefaultValues.map(defaultValue =>
            <DefaultValueRow {...props}
                             key={defaultValue.uuid}
                             defaultValue={defaultValue}
                             onDelete={defaultValue => onDefaultValueDelete(nodeDef, uiDefaultValues, defaultValue, putNodeDefProp)}
                             onUpdate={defaultValue => onDefaultValueUpdate(nodeDef, uiDefaultValues, defaultValue, putNodeDefProp)}
            />
          )
        }
      </div>
    </div>
  )
}

export default DefaultValues