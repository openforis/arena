import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import axios from 'axios'

import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as DateUtils from '@core/dateUtils'
import * as StringUtils from '@core/stringUtils'
import * as Expression from '@core/expressionParser/expression'

import { SurveyState, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import ButtonGroup from '@webapp/components/form/buttonGroup'
import Dropdown from '@webapp/components/form/Dropdown'
import { Input } from '@webapp/components/form/Input'
import { DateInput } from '@webapp/components/form/DateTimeInput'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { TestId } from '@webapp/utils/testId'

import { useAsyncGetRequest } from '../../hooks'
import * as ExpressionParser from '../expressionParser'
import { BinaryOperandType } from './binaryOperand'
import { findVariableByName } from '../expressionVariables'

const isValueText = (nodeDef, value) =>
  nodeDef &&
  (StringUtils.isBlank(value) ||
    ![NodeDef.nodeDefType.boolean, NodeDef.nodeDefType.decimal, NodeDef.nodeDefType.integer].includes(
      NodeDef.getType(nodeDef)
    ))

const parseValue = (nodeDef, value) => (isValueText(nodeDef, value) ? A.parse(value) : value)

const getValue = (nodeDef, value) => (isValueText(nodeDef, value) ? A.stringify(value) : value)

const loadItems = async (params) => {
  const {
    data: { items },
  } = await axios.get('/api/expression/literal/items', { params })
  return items
}

const _findNodeDefByName = ({ survey, name, variables }) => {
  if (Objects.isEmpty(name)) {
    return null
  }
  const possibleNodeDefNames = [name, StringUtils.removeSuffix('_label')(name)]
  for (const possibleNodeDefName of possibleNodeDefNames) {
    const nodeDef = Survey.findNodeDefByName(possibleNodeDefName)(survey)
    if (nodeDef) {
      return { nodeDef, isIdentifierField: true }
    }
  }
  const variable = findVariableByName({ variables, name })
  if (variable) {
    const nodeDef = Survey.getNodeDefByUuid(variable.uuid)(survey)
    if (nodeDef) {
      return { nodeDef, isIdentifierField: false }
    }
  }
  return null
}

const _getNodeDef = ({ expressionNodeParent, nodeDefCurrent, survey, type, variables = [] }) => {
  if (!type || BinaryOperandType.isLeft(type)) {
    return { nodeDef: nodeDefCurrent, isIdentifierField: true }
  }
  if (BinaryOperandType.isRight(type) && Expression.isBinary(expressionNodeParent)) {
    const nodeLeftOperand = A.prop(BinaryOperandType.left, expressionNodeParent)
    if (Expression.isThis(nodeLeftOperand)) {
      return { nodeDef: nodeDefCurrent, isIdentifierField: true }
    }
    if (Expression.isIdentifier(nodeLeftOperand)) {
      const identifierName = A.prop('name', nodeLeftOperand)
      if (identifierName === Expression.thisVariable) {
        return { nodeDef: nodeDefCurrent, isIdentifierField: true }
      }
      return _findNodeDefByName({ survey, name: identifierName, variables })
    }
  }
  return null
}

const Literal = (props) => {
  const { expressionNodeParent, node, nodeDefCurrent, onChange, type, variables = [] } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const survey = useSelector(SurveyState.getSurvey)

  const { nodeDef, isIdentifierField } =
    _getNodeDef({ expressionNodeParent, nodeDefCurrent, survey, type, variables }) ?? {}
  const literalSearchParams =
    nodeDef && isIdentifierField ? ExpressionParser.getLiteralSearchParams(survey, nodeDef, lang) : null

  const nodeValue = parseValue(nodeDef, A.propOr(null, 'raw', node))
  const nodeValueString = nodeValue ?? ''

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
          className="dropdown-literal"
          testId={TestId.expressionEditor.literalDropdown}
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
              label: i18n.t(`surveyForm:nodeDefBoolean.labelValue.${NodeDef.getLabelValue(nodeDef)}.${value}`),
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
        return <Input onChange={onChangeValue} value={nodeValueString} />
    }
  }

  return <div className="literal">{getRenderer()}</div>
}

Literal.propTypes = {
  expressionNodeParent: PropTypes.any,
  node: PropTypes.any.isRequired,
  nodeDefCurrent: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  variables: PropTypes.array,
}

export default Literal
