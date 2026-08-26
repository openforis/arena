import React, { forwardRef, useEffect } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import TreeChart from '@webapp/charts/TreeChart'
import { useNodeDefTreeChart } from '@webapp/charts/TreeChart/useNodeDefTreeChart'

const nodeClassFunction = (d) => `node-grid${NodeDef.isVirtual(d.data) ? ' node-virtual' : ''}`

export const SurveyHierarchyTree = forwardRef((props, ref) => {
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

SurveyHierarchyTree.propTypes = {
  data: PropTypes.object.isRequired,
  nodeDefLabelType: PropTypes.string,
  onEntityClick: PropTypes.func.isRequired,
}
