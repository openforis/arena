import React, { forwardRef, useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import TreeChart from '@webapp/charts/TreeChart'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const nodeClassFunction = (d) => `node-grid${NodeDef.isVirtual(d.data) ? ' node-virtual' : ''}`

export const SurveyHierarchyTree = forwardRef((props, ref) => {
  const { data, nodeDefLabelType, onEntityClick } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const nodeLabelFunction = useCallback(
    (d) => NodeDef.getLabelWithType({ nodeDef: d.data, lang, type: nodeDefLabelType }),
    [lang, nodeDefLabelType]
  )

  const nodeTooltipFunction = useCallback((d) => NodeDef.getDescription(lang)(d.data), [lang])

  const wrapperRef = useRef()

  useEffect(() => {
    const domElement = wrapperRef.current
    ref.current = new TreeChart({
      domElement,
      data,
      i18n,
      nodeClassFunction,
      nodeLabelFunction,
      nodeTooltipFunction,
      onNodeClick: onEntityClick,
      svgClass: 'survey-hierarchy__svg',
      rootNodeElementId: 'survey-hierarchy__root-g',
      wrapperClass: 'survey-hierarchy__tree',
    })
  }, [])

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

  return <div className="hierarchy__tree survey-hierarchy__tree" ref={wrapperRef} />
})

SurveyHierarchyTree.propTypes = {
  data: PropTypes.object.isRequired,
  nodeDefLabelType: PropTypes.string,
  onEntityClick: PropTypes.func.isRequired,
}
