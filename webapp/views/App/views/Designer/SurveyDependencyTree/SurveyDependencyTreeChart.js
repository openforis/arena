import React, { forwardRef, useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import TreeChart from '@webapp/charts/TreeChart'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

export const SurveyDependencyTreeChart = forwardRef((props, ref) => {
  const { data, extraLinksGroups, nodeDefLabelType, onNodeClick, selectedNodeUuid } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const nodeClassFunction = (d) => {
    const nodeDef = d.data
    const classes = ['node-grid']
    if (NodeDef.isVirtual(nodeDef)) {
      classes.push('node-virtual')
    }
    return classes.join(' ')
  }

  const nodeLabelFunction = useCallback(
    (d) => NodeDef.getLabelWithType({ nodeDef: d.data, lang, type: nodeDefLabelType }),
    [lang, nodeDefLabelType]
  )

  const nodeTooltipFunction = useCallback((d) => NodeDef.getDescription(lang)(d.data), [lang])

  const wrapperRef = useRef()

  useEffect(() => {
    const domElement = wrapperRef.current
    ref.current?.destroy()

    ref.current = new TreeChart({
      domElement,
      data,
      extraLinksGroups,
      i18n,
      nodeClassFunction,
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
    const tree = ref.current
    return () => tree?.destroy()
  }, [ref])

  // force updating labels in TreeChart when label and tooltip function change (depending on lang and labelType)
  useEffect(() => {
    const tree = ref.current
    tree.nodeLabelFunction = nodeLabelFunction
    tree.nodeTooltipFunction = nodeTooltipFunction
  }, [nodeLabelFunction, nodeTooltipFunction, ref])

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
