import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import axios from 'axios'

import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import { SurveyState } from '@webapp/store/survey'
import { useI18n, useLang } from '@webapp/store/system'

import { useAsyncGetRequest } from '../../hooks'

import ButtonGroup from '@webapp/components/form/buttonGroup'
import Dropdown from '@webapp/components/form/Dropdown'
import { Input } from '@webapp/components/form/Input'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import * as ExpressionParser from '../expressionParser'
import { BinaryOperandType } from './binaryOperand'

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
  const lang = useLang()
  const survey = useSelector(SurveyState.getSurvey)

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

  const onChangeValue = (val) => {
    const value = val && getValue(nodeDefCurrent, val)
    onChange(R.pipe(R.assoc('raw', value), R.assoc('value', value))(node))
  }

  // on nodeValue update, if literalSearchParams is passed as prop, fetches the selection item for dropdown
  useEffect(() => {
    if (literalSearchParams) fetchItem()
  }, [nodeValue])

  const getRenderer = () => {
    if (literalSearchParams) {
      return (
        <Dropdown
          items={(value) => loadItems({ ...literalSearchParams, value })}
          itemLabel="label"
          onChange={(itm) => onChangeValue(itm ? itm.key : null)}
          selection={item}
        />
      )
    }
    if (BinaryOperandType.isLeft(type) && (NodeDef.isInteger(nodeDefCurrent) || NodeDef.isDecimal(nodeDefCurrent))) {
      return (
        <Input
          numberFormatProps={NodeDefUIProps.getNumberFormatProps(nodeDefCurrent)}
          onChange={onChangeValue}
          value={nodeValue}
        />
      )
    }
    if (BinaryOperandType.isLeft(type) && NodeDef.isBoolean(nodeDefCurrent)) {
      return (
        <ButtonGroup
          className="literal-btn-group-boolean"
          selectedItemKey={nodeValue}
          onChange={onChangeValue}
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
