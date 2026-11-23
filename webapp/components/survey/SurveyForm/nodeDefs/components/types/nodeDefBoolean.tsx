import './nodeDefBoolean.scss'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'

import { Radiobox } from '@webapp/components/form'

type NodeDefBooleanProps = {
  canEditRecord?: boolean
  edit?: boolean
  entry?: boolean
  nodeDef: any
  nodes?: any[]
  readOnly?: boolean
  updateNode: (...args: any[]) => any
}

const NodeDefBoolean = (props: NodeDefBooleanProps) => {
  const {
    canEditRecord = false,
    edit = false,
    entry = false,
    nodeDef,
    nodes = null,
    readOnly = false,
    updateNode,
  } = props

  const node = entry ? nodes[0] : null

  const nodeValue = Node.getValue(node, '')

  return (
    <div className="survey-form__node-def-boolean">
      {['true', 'false'].map((value) => {
        const checked = nodeValue == value
        return (
          <Radiobox
            key={value}
            checked={checked}
            disabled={edit || !canEditRecord || readOnly}
            label={`surveyForm:nodeDefBoolean.labelValue.${NodeDef.getLabelValue(nodeDef)}.${value}`}
            onChange={() => updateNode(nodeDef, node, checked ? null : value)}
            size="small"
            value={value}
          />
        )
      })}
    </div>
  )
}

export default NodeDefBoolean
