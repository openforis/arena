import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'

import axios from 'axios'
import * as R from 'ramda'

import Dropdown from '../../form/dropdown'
import { BinaryOperandType } from './binaryOperand'
import * as ExpressionParser from '../expressionParser'

import NodeDef from '../../../../common/survey/nodeDef'
import StringUtils from '../../../../common/stringUtils'

import * as AppState from '../../../app/appState'
import * as SurveyState from '../../../survey/surveyState'
import { useAsyncGetRequest } from '../../hooks'

const isValueText = (nodeDef, value) => {
  return nodeDef
    ? !(NodeDef.isInteger(nodeDef) || NodeDef.isDecimal(nodeDef) || StringUtils.isBlank(value))
    : false
}

const parseValue = (nodeDef, value) => isValueText(nodeDef, value) ? JSON.parse(value) : value

const getValue = (nodeDef, value) => isValueText(nodeDef, value) ? JSON.stringify(value) : value

const loadItems = async params => {
  const { data: { items } } = await axios.get('/api/expression/literal/items', { params })
  return items
}

const Literal = props => {

  const { node, nodeDefCurrent, literalSearchParams, onChange } = props
  const nodeValue = parseValue(nodeDefCurrent, R.propOr(null, 'raw', node))

  const { data: { item = {} } = { item: {} }, dispatch: fetchItem } = useAsyncGetRequest(
    '/api/expression/literal/item',
    { params: { ...literalSearchParams, value: nodeValue } }
  )
  const [items, setItems] = useState([])

  const onChangeValue = val => {
    const value = getValue(nodeDefCurrent, val)
    onChange(R.pipe(
      R.assoc('raw', value),
      R.assoc('value', value),
    )(node))
  }

  if (literalSearchParams) {
    useEffect(() => {
      (async () => {
        fetchItem()
        const itemsUpdate = await loadItems({ ...literalSearchParams, value: '' })
        setItems(itemsUpdate)
      })()
    }, [])
  }

  return (
    <div className="literal">
      {
        literalSearchParams
          ? (
            <Dropdown
              items={items}
              itemsLookupFunction={value => loadItems({ ...literalSearchParams, value })}
              itemKeyProp="key"
              itemLabelProp="label"
              onChange={item => item && onChangeValue(item.key)}
              selection={item}
            />
          )
          : (
            <input
              className="form-input"
              value={nodeValue}
              size={25}
              onChange={e => onChangeValue(e.target.value)}
            />
          )

      }
    </div>
  )

}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const lang = AppState.getLang(state)
  const { nodeDefCurrent, type } = props

  const literalSearchParams = nodeDefCurrent && BinaryOperandType.isLeft(type)
    ? ExpressionParser.getLiteralSearchParams(survey, nodeDefCurrent, lang)
    : null

  return {
    literalSearchParams
  }
}

export default connect(mapStateToProps)(Literal)