import * as A from '@core/arena'
import * as Expression from '@core/expressionParser/expression'
import { useI18n } from '@webapp/store/system'
import Dropdown from '../../form/Dropdown'

import BinaryOperand, { BinaryOperandType } from './binaryOperand'
import EditButtons from './EditButtons'
import type { ExpressionNodeComponentProps } from './expressionNode'

const Binary = (props: ExpressionNodeComponentProps) => {
  const {
    canDelete = false,
    isBoolean = false,
    level = 0,
    node,
    nodeDefCurrent = null,
    onChange,
    onDelete = null,
    renderNode,
    variables = null,
  } = props

  const i18n = useI18n()

  const leftOperand = A.prop(BinaryOperandType.left)(node)
  const leftOperandType = Expression.getType(leftOperand)

  const showOperator = node.operator || leftOperandType !== Expression.types.Literal

  const binaryOperator = showOperator ? Expression.operators.findBinary(node.operator) : null

  const createOperand = (type) => (
    <BinaryOperand
      canDelete={canDelete}
      isBoolean={isBoolean}
      level={level}
      node={node}
      nodeDefCurrent={nodeDefCurrent}
      onChange={onChange}
      onDelete={onDelete}
      renderNode={renderNode}
      type={type}
      variables={variables}
    />
  )

  return (
    <div className="binary">
      {createOperand(BinaryOperandType.left)}

      {showOperator && (
        <>
          <Dropdown
            className="operator"
            items={Expression.operators.binaryValues}
            placeholder={i18n.t('expressionEditor.operator')}
            selection={binaryOperator}
            onChange={(item) => onChange(A.assoc('operator', item?.value ?? '', node))}
          />

          {createOperand(BinaryOperandType.right)}

          {isBoolean && <EditButtons node={node} onChange={onChange} onDelete={onDelete} canDelete={canDelete} />}
        </>
      )}
    </div>
  )
}

export default Binary
