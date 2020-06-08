import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import axios from 'axios'

import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import * as AppState from '@webapp/app/appState'
import { SurveyState } from '@webapp/store/survey'
import * as NodeDefUIProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'
import ButtonGroup from '@webapp/components/form/buttonGroup'
import Dropdown from '../../form/dropdown'
import { useAsyncGetRequest, useI18n } from '../../hooks'
import * as ExpressionParser from '../expressionParser'
import { BinaryOperandType } from './binaryOperand'
import { Input } from '../../form/input'

const isValueText = (nodeDef, value) =>
  nodeDef ? !(NodeDef.isInteger(nodeDef) || NodeDef.isDecimal(nodeDef) || StringUtils.isBlank(value)) : false

const parseValue = (nodeDef, value) => (isValueText(nodeDef, value) ? JSON.parse(value) : value)

const getValue = (nodeDef, value) => (isValueText(nodeDef, value) ? JSON.stringify(value) : value)

const loadItems = async (params) => {
  const {
    data: { items },
  } = await axios.get('/api/expression/literal/items', { params })
  return items
}

const Literal = (props) => {
  const { node, nodeDefCurrent, onChange, type } = props

  const i18n = useI18n()
  const survey = useSelector(SurveyState.getSurvey)
  const lang = useSelector(AppState.getLang)

  const literalSearchParams =
    nodeDefCurrent && BinaryOperandType.isLeft(type)
      ? ExpressionParser.getLiteralSearchParams(survey, nodeDefCurrent, lang)
      : null

  const nodeValue = parseValue(nodeDefCurrent, R.propOr(null, 'raw', node))

  const { data: { item = {} } = { item: {} }, dispatch: fetchItem } = useAsyncGetRequest(
    '/api/expression/literal/item',
    {
      params: { ...literalSearchParams, value: nodeValue },
    }
  )
  const [items, setItems] = useState([])

  const onChangeValue = (val) => {
    const value = getValue(nodeDefCurrent, val)
    onChange(R.pipe(R.assoc('raw', value), R.assoc('value', value))(node))
  }

  if (literalSearchParams) {
    useEffect(() => {
      ;(async () => {
        if (nodeValue) fetchItem()
        const itemsUpdate = await loadItems({
          ...literalSearchParams,
          value: '',
        })
        setItems(itemsUpdate)
      })()
    }, [])
  }

  const getRenderer = () => {
    if (literalSearchParams) {
      return (
        <Dropdown
          items={items}
          itemsLookupFunction={(value) => loadItems({ ...literalSearchParams, value })}
          itemKeyProp="key"
          itemLabelProp="label"
          onChange={(itm) => itm && onChangeValue(itm.key)}
          selection={item}
        />
      )
    }
    if (BinaryOperandType.isLeft(type) && (NodeDef.isInteger(nodeDefCurrent) || NodeDef.isDecimal(nodeDefCurrent))) {
      const inputTextProps = NodeDefUIProps.getInputTextProps(nodeDefCurrent)
      const { mask, showMask, placeholderChar } = inputTextProps
      return (
        <Input
          mask={mask}
          showMask={showMask}
          placeholderChar={placeholderChar}
          value={nodeValue}
          onChange={(value) => onChangeValue(value)}
        />
      )
    }
    if (BinaryOperandType.isLeft(type) && NodeDef.isBoolean(nodeDefCurrent)) {
      return (
        <ButtonGroup
          className="literal-btn-group-boolean"
          selectedItemKey={nodeValue}
          onChange={(value) => onChangeValue(value)}
          items={['true', 'false'].map((value) => ({
            key: value,
            label: i18n.t(`common.${value}`),
          }))}
        />
      )
    }
    return <input className="form-input" value={nodeValue} size={25} onChange={(e) => onChangeValue(e.target.value)} />
  }

  return <div className="literal">{getRenderer()}</div>
}

Literal.propTypes = {
  node: PropTypes.any.isRequired,
  nodeDefCurrent: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
}

Literal.defaultProps = {
  nodeDefCurrent: null,
}

export default Literal
