import React from 'react'
import * as R from 'ramda'

import { getSurveyDefaultLanguage } from '../../../../../../common/survey/survey'
import { isNodeDefMultiple } from '../../../../../../common/survey/nodeDef'
import { getCodeListItemCode, getCodeListItemLabel } from '../../../../../../common/survey/codeList'
import { getNodeValue, newNode } from '../../../../../../common/record/node'

const Checkbox = props => {
  const {survey, edit, item, nodeDef, parentNode, nodes, updateNode, removeNode} = props

  const language = getSurveyDefaultLanguage(survey)
  const itemCode = getCodeListItemCode(item)
  const matchingNode = R.find(node => getNodeValue(node).code === itemCode)(nodes)
  const selected = !R.isNil(matchingNode)

  return (
    <button
      className={`btn btn-of-light ${selected ? 'active' : ''}`}
      style={{
        pointerEvents: 'all',
      }}
      aria-disabled={edit}
      onClick={() => {
        if (selected) {
          removeNode(nodeDef, matchingNode)
        } else {
          const nodeToUpdate =
            (isNodeDefMultiple(nodeDef) || R.isEmpty(nodes))
              ? newNode(nodeDef.id, parentNode.recordId, parentNode.uuid)
              : nodes[0]
          updateNode(nodeDef, nodeToUpdate, {code: itemCode})
        }
      }}>
      {getCodeListItemLabel(language)(item)}
    </button>
  )
}

const CodeListCheckbox = props => {
  const {items = []} = props

  const disabled = R.isEmpty(items)

  return <div className="node-def__code-checkbox-wrapper">
    {
      items.map(item =>
        <Checkbox {...props}
                  disabled={disabled}
                  key={item.uuid}
                  item={item}/>
      )
    }
  </div>
}

export default CodeListCheckbox