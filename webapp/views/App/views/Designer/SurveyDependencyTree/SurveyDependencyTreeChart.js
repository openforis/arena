import React, { forwardRef, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import TreeChart from '@webapp/charts/TreeChart'
import { highlightClassName } from '@webapp/charts/TreeChart/TreeChart'
import { useNodeDefTreeChart } from '@webapp/charts/TreeChart/useNodeDefTreeChart'

export const SurveyDependencyTreeChart = forwardRef((props, ref) => {
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
})

SurveyDependencyTreeChart.propTypes = {
  data: PropTypes.object.isRequired,
  extraLinksGroups: PropTypes.array,
  nodeDefLabelType: PropTypes.string,
  onNodeClick: PropTypes.func.isRequired,
  selectedNodeUuid: PropTypes.string,
}
