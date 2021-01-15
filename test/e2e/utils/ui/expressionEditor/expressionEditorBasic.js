import { below, click, within, writeIntoEl, $ } from '../../api'

const elements = {
  binaryLeftBtnVar: () => $('.binary-left .btn-switch-operand-var'),
  binaryLeftBtnConst: () => $('.binary-left .btn-switch-operand-const'),
  binaryLeftIdentifier: () => $('.binary-left .identifier'),
  binaryLeftLiteral: () => $('.binary-left .literal input'),
  binaryOperator: () => $('.binary .operator'),
  binaryOperatorDropdownList: () => $('.autocomplete-list'),
  binaryRightBtnVar: () => $('.binary-right .btn-switch-operand-var'),
  binaryRightBtnConst: () => $('.binary-right .btn-switch-operand-const'),
  binaryRightIdentifier: () => $('.binary-right .identifier'),
  binaryRightLiteral: () => $('.binary-right .literal .form-input'),
}

const _selectBinaryLeftIdentifier = async ({ identifier }) => {
  await click(elements.binaryLeftBtnVar())
  await click(elements.binaryLeftIdentifier())
  await click(identifier, below(elements.binaryLeftIdentifier()))
}

const _selectOperator = async ({ operator }) => {
  await click(elements.binaryOperator())
  await click(operator, within(elements.binaryOperatorDropdownList()))
}

const _selectBinaryRightIdentifier = async ({ identifier }) => {
  await click(elements.binaryRightBtnVar())
  await click(elements.binaryRightIdentifier())
  await click(identifier, below(elements.binaryRightIdentifier()))
}

const _writeBinaryRightConst = async ({ value }) => {
  await click(elements.binaryRightBtnConst())
  await writeIntoEl({ text: value, element: elements.binaryRightLiteral() })
}

export const setBinaryExpression = async ({ binaryExpression }) => {
  const { left, operator, right } = binaryExpression
  const { identifier: leftIdentifier } = left
  const { identifier: rightIdentifier, constant: rightConstant } = right

  if (leftIdentifier) {
    await _selectBinaryLeftIdentifier({ identifier: leftIdentifier })
  }
  await _selectOperator({ operator })

  if (rightIdentifier) {
    await _selectBinaryRightIdentifier({ identifier: rightIdentifier })
  } else if (rightConstant) {
    await _writeBinaryRightConst({ value: rightConstant })
  }
}

export const setBinaryLeftConst = async ({ value }) => {
  await click(elements.binaryLeftBtnConst())
  await writeIntoEl({ text: value, element: elements.binaryLeftLiteral() })
}
