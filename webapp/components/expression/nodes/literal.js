import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import axios from 'axios'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as DateUtils from '@core/dateUtils'
import * as StringUtils from '@core/stringUtils'
import * as Expression from '@core/expressionParser/expression'

import { SurveyState } from '@webapp/store/survey'
import { useI18n, useLang } from '@webapp/store/system'

import ButtonGroup from '@webapp/components/form/buttonGroup'
import Dropdown from '@webapp/components/form/Dropdown'
import { Input } from '@webapp/components/form/Input'
import DateInput from '@webapp/components/form/DateInput'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { TestId } from '@webapp/utils/testId'

import { useAsyncGetRequest } from '../../hooks'
import * as ExpressionParser from '../expressionParser'
import { BinaryOperandType } from './binaryOperand'

const isValueText = (nodeDef, value) =>
  nodeDef
    ? !(
        NodeDef.isBoolean(nodeDef) ||
        NodeDef.isInteger(nodeDef) ||
        NodeDef.isDecimal(nodeDef) ||
        StringUtils.isBlank(value)
      )
    : false

const parseValue = (nodeDef, value) => (isValueText(nodeDef, value) ? A.parse(value) : value)

const getValue = (nodeDef, value) => (isValueText(nodeDef, value) ? A.stringify(value) : value)

const loadItems = async (params) => {
  const {
    data: { items },
  } = await axios.get('/api/expression/literal/items', { params })
  return items
}

const _getNodeDef = ({ expressionNodeParent, nodeDefCurrent, survey, type }) => {
  if (BinaryOperandType.isLeft(type)) {
    return nodeDefCurrent
  }
  if (BinaryOperandType.isRight(type) && Expression.isBinary(expressionNodeParent)) {
    const nodeLeftOperand = A.prop(BinaryOperandType.left, expressionNodeParent)
    if (Expression.isIdentifier(nodeLeftOperand)) {
      const identifierName = A.prop('name', nodeLeftOperand)
      const nodeDef = Survey.getNodeDefByName(identifierName)(survey)
      if (!nodeDef) {
        const nameWithOutSubfix = identifierName.replace('_label', '')
        return Survey.getNodeDefByName(nameWithOutSubfix)(survey)
      }
      return nodeDef
    }
  }
  return null
}

const Literal = (props) => {
  const { expressionNodeParent, node, nodeDefCurrent, onChange, type } = props

  const i18n = useI18n()
  const lang = useLang()
  const survey = useSelector(SurveyState.getSurvey)

  const nodeDef = _getNodeDef({ expressionNodeParent, nodeDefCurrent, survey, type })
  const literalSearchParams = nodeDef ? ExpressionParser.getLiteralSearchParams(survey, nodeDef, lang) : null

  const nodeValue = parseValue(nodeDef, A.propOr(null, 'raw', node))
  const nodeValueString = nodeValue || ''

  const { data: { item = {} } = { item: {} }, dispatch: fetchItem } = useAsyncGetRequest(
    '/api/expression/literal/item',
    {
      params: { ...literalSearchParams, value: nodeValue },
    }
  )

  const onChangeValue = (val) => {
    const value = val && getValue(nodeDef, val)
    onChange(A.pipe(A.assoc('raw', value), A.assoc('value', value))(node))
  }

  // on nodeValue update, if literalSearchParams is passed as prop, fetches the selection item for dropdown
  useEffect(() => {
    if (literalSearchParams) fetchItem()
  }, [nodeValue])

  const getRenderer = () => {
    if (literalSearchParams) {
      return (
        <Dropdown
          idInput={TestId.expressionEditor.literalDropdown}
          items={(value) => loadItems({ ...literalSearchParams, value })}
          onChange={(_item) => onChangeValue(_item ? _item.value : null)}
          selection={item}
        />
      )
    }
    switch (NodeDef.getType(nodeDef)) {
      case NodeDef.nodeDefType.integer:
      case NodeDef.nodeDefType.decimal:
        return (
          <Input
            numberFormat={NodeDefUIProps.getNumberFormat(nodeDef)}
            onChange={onChangeValue}
            value={nodeValueString}
          />
        )
      case NodeDef.nodeDefType.boolean:
        return (
          <ButtonGroup
            className="literal-btn-group-boolean"
            selectedItemKey={nodeValue}
            onChange={onChangeValue}
            items={['true', 'false'].map((value) => ({
              key: value,
              label: i18n.t(`surveyForm.nodeDefBoolean.labelValue.${NodeDef.getLabelValue(nodeDef)}.${value}`),
            }))}
          />
        )
      case NodeDef.nodeDefType.date: {
        const formatStorage = DateUtils.formats.dateISO
        const formatDisplay = DateUtils.formats.dateDefault
        return (
          <DateInput
            onChange={(selectedDate) => {
              const dateConverted = DateUtils.convertDate({
                dateStr: selectedDate,
                formatFrom: formatDisplay,
                formatTo: formatStorage,
              })
              onChangeValue(dateConverted)
            }}
            value={DateUtils.convertDate({
              dateStr: nodeValueString,
              formatFrom: formatStorage,
              formatTo: formatDisplay,
            })}
          />
        )
      }
      default:
        return (
          <input
            className="form-input"
            value={nodeValueString}
            size={25}
            onChange={(e) => onChangeValue(e.target.value)}
          />
        )
    }
  }

  return <div className="literal">{getRenderer()}</div>
}

Literal.propTypes = {
  expressionNodeParent: PropTypes.any.isRequired,
  node: PropTypes.any.isRequired,
  nodeDefCurrent: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
}

Literal.defaultProps = {
  nodeDefCurrent: null,
}

export default Literal
