import { forwardRef, useCallback, useEffect, type MutableRefObject } from 'react'

import * as NodeDef from '@core/survey/nodeDef'

import TreeChart from '@webapp/charts/TreeChart'
import { highlightClassName } from '@webapp/charts/TreeChart/TreeChart'
import { useNodeDefTreeChart } from '@webapp/charts/TreeChart/useNodeDefTreeChart'

type SurveyDependencyTreeChartProps = {
  data: Record<string, any>
  extraLinksGroups?: any[]
  nodeDefLabelType?: NodeDef.NodeDefLabelType
  onNodeClick: (...args: any[]) => any
  selectedNodeUuid?: string
}

export const SurveyDependencyTreeChart = forwardRef<TreeChart, SurveyDependencyTreeChartProps>(
  (props, forwardedRef) => {
    // the tree chart instance is exposed to the parent through the forwarded ref
    const ref = forwardedRef as MutableRefObject<TreeChart | null>
    const { data, extraLinksGroups, nodeDefLabelType, onNodeClick, selectedNodeUuid } = props

    const { i18n, wrapperRef, nodeLabelFunction, nodeTooltipFunction, nodeIconFunction } = useNodeDefTreeChart({
      ref,
      nodeDefLabelType,
    })

    const nodeClassFunction = useCallback(
      (d) => {
        const nodeDef = d.data
        const classes = ['node-grid']
        if (NodeDef.isVirtual(nodeDef)) {
          classes.push('node-virtual')
        }
        if (selectedNodeUuid && NodeDef.getUuid(nodeDef) === selectedNodeUuid) {
          classes.push(highlightClassName)
        }
        return classes.join(' ')
      },
      [selectedNodeUuid]
    )

    useEffect(() => {
      const domElement = wrapperRef.current
      ref.current?.destroy()

      ref.current = new TreeChart({
        domElement,
        data,
        extraLinksGroups,
        i18n,
        nodeClassFunction,
        nodeIconFunction,
        nodeLabelFunction,
        nodeTooltipFunction,
        svgClass: 'survey-dependency-tree__svg',
        rootNodeElementId: 'survey-dependency-tree__root-g',
        wrapperClass: 'survey-dependency-tree',
        onNodeClick,
        options: {
          collapsible: false,
          parentChild: { directLines: true },
        },
        selectedNodeUuid,
      })
    }, [data, extraLinksGroups, selectedNodeUuid])

    useEffect(() => {
      ref.current?.updateSelection()
    }, [ref, selectedNodeUuid])

    return <div className="hierarchy__tree survey-dependency-tree" ref={wrapperRef} />
  }
)
