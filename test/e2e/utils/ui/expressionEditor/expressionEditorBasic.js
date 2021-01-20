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

const _writeBinaryLeftConst = async ({ value }) => {
  await click(elements.binaryLeftBtnConst())
  await writeIntoEl({ text: value, element: elements.binaryLeftLiteral() })
}

const _selectBinaryLeftBoolean = async ({ value }) => {
  await click(elements.binaryLeftBtnConst())
  await click(value)
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

const _selectBinaryRightBoolean = async ({ value }) => {
  await click(elements.binaryRightBtnConst())
  await click(value)
}

export const setBinaryExpression = async ({ binaryExpression }) => {
  const { left, operator, right = {} } = binaryExpression
  const { identifier: leftIdentifier, constant: leftConstant, constantBoolean: leftConstantBoolean } = left
  const { identifier: rightIdentifier, constant: rightConstant, constantBoolean: rightConstantBoolean } = right

  if (leftConstant) {
    await _writeBinaryLeftConst({ value: leftConstant })
  } else if (leftIdentifier) {
    await _selectBinaryLeftIdentifier({ identifier: leftIdentifier })
  } else if (leftConstantBoolean) {
    await _selectBinaryLeftBoolean({ value: leftConstantBoolean })
  }

  if (operator) {
    await _selectOperator({ operator })
  }

  if (rightConstant) {
    await _writeBinaryRightConst({ value: rightConstant })
  } else if (rightIdentifier) {
    await _selectBinaryRightIdentifier({ identifier: rightIdentifier })
  } else if (rightConstantBoolean) {
    await _selectBinaryRightBoolean({ value: leftConstantBoolean })
  }
}

export const setBinaryLeftConst = async ({ value }) => {
  await click(elements.binaryLeftBtnConst())
  await writeIntoEl({ text: value, element: elements.binaryLeftLiteral() })
}
