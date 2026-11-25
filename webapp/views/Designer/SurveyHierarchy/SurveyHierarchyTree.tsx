import { forwardRef, type MutableRefObject, useEffect } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import TreeChart from '@webapp/charts/TreeChart'
import type { TreeChartNode } from '@webapp/charts/TreeChart/TreeChart'
import { useNodeDefTreeChart } from '@webapp/charts/TreeChart/useNodeDefTreeChart'

const nodeClassFunction = (d: TreeChartNode) => `node-grid${NodeDef.isVirtual(d.data) ? ' node-virtual' : ''}`

type SurveyHierarchyTreeProps = {
  data: Record<string, any>
  nodeDefLabelType?: NodeDef.NodeDefLabelType
  onEntityClick: (...args: any[]) => any
}

export const SurveyHierarchyTree = forwardRef<TreeChart, SurveyHierarchyTreeProps>((props, forwardedRef) => {
  // the tree chart instance is exposed to the parent through the forwarded ref
  const ref = forwardedRef as MutableRefObject<TreeChart | null>
  const { data, nodeDefLabelType, onEntityClick } = props

  const { i18n, wrapperRef, nodeLabelFunction, nodeTooltipFunction, nodeIconFunction } = useNodeDefTreeChart({
    ref,
    nodeDefLabelType,
  })

  useEffect(() => {
    const domElement = wrapperRef.current
    ref.current = new TreeChart({
      domElement,
      data,
      i18n,
      nodeClassFunction,
      nodeIconFunction,
      nodeLabelFunction,
      nodeTooltipFunction,
      onNodeClick: onEntityClick,
      svgClass: 'survey-hierarchy__svg',
      rootNodeElementId: 'survey-hierarchy__root-g',
      wrapperClass: 'survey-hierarchy__tree',
    })
  }, [])

  return <div className="hierarchy__tree survey-hierarchy__tree" ref={wrapperRef} />
})
