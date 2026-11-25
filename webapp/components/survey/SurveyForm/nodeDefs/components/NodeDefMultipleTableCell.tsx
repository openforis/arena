import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

import NodeDefMultipleEditDialog from './NodeDefMultipleEditDialog'
import type { ArenaAnyNodeDef } from '@openforis/arena-core'

const getNodeValues = (nodeDef, nodes, lang) => {
  const getNodeValue = (node) => {
    if (NodeDef.isCode(nodeDef)) {
      const item = NodeRefData.getCategoryItem(node)
      return CategoryItem.getLabel(lang)(item)
    }

    if (NodeDef.isFile(nodeDef)) {
      return Node.getFileName(node)
    }

    if (NodeDef.isTaxon(nodeDef)) {
      const taxon = NodeRefData.getTaxon(node)
      // unlisted/unknown taxa can have a scientific name entered by the user
      return Node.getScientificName(node) || (taxon ? Taxon.getScientificName(taxon) : '')
    }

    return Node.getValue(node)
  }

  return nodes
    .filter((node) => !Node.isPlaceholder(node) && !Node.isValueBlank(node))
    .map((node) => getNodeValue(node))
    .join(', ')
}

type NodeDefMultipleTableCellProps = {
  canEditRecord: boolean
  lang: string
  nodeDef: ArenaAnyNodeDef
  nodes: any[]
}

const NodeDefMultipleTableCell = (props: NodeDefMultipleTableCellProps) => {
  const { nodeDef, nodes, lang, canEditRecord } = props

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [nodeValues, setNodeValues] = useState('')

  useEffect(() => {
    const nodeValuesUpdate = getNodeValues(nodeDef, nodes, lang)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps the derived values in sync with the nodes prop
    setNodeValues(nodeValuesUpdate)
  }, [nodes])

  if (showEditDialog) {
    return ReactDOM.createPortal(
      <NodeDefMultipleEditDialog {...props} onClose={() => setShowEditDialog(false)} />,
      document.body
    )
  }
  return (
    <div className="survey-form__node-def-table-cell-body-multiple">
      <span className="values-summary">
        <LabelWithTooltip label={nodeValues} />
      </span>
      <button type="button" className="btn-s" onClick={() => setShowEditDialog(true)}>
        <span className={`icon icon-12px ${canEditRecord ? 'icon-pencil2' : 'icon-eye'}`} />
      </button>
    </div>
  )
}

export default NodeDefMultipleTableCell
