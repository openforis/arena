import React, { forwardRef, useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import TreeChart from '@webapp/charts/TreeChart'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const nodeClassFunction = (d) => `node-grid${NodeDef.isVirtual(d.data) ? ' node-virtual' : ''}`

export const SurveyDependencyTreeChart = forwardRef((props, ref) => {
  const { data, extraLinks, nodeDefLabelType } = props

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
      extraLinks,
      i18n,
      nodeClassFunction,
      nodeLabelFunction,
      nodeTooltipFunction,
      svgClass: 'survey-dependency-tree__svg',
      rootNodeElementId: 'survey-dependency-tree__root-g',
      wrapperClass: 'survey-dependency-tree',
      options: {
        parentChild: { directLines: true },
      },
    })
  }, [])

  useEffect(() => {
    const tree = ref.current
    return () => tree?.disconnect()
  }, [ref])

  // force updating labels in TreeChart when label and tooltip function change (depending on lang and labelType)
  useEffect(() => {
    const tree = ref.current
    tree.nodeLabelFunction = nodeLabelFunction
    tree.nodeTooltipFunction = nodeTooltipFunction
  }, [nodeLabelFunction, nodeTooltipFunction, ref])

  return <div className="hierarchy__tree survey-dependency-tree" ref={wrapperRef} />
})

SurveyDependencyTreeChart.propTypes = {
  data: PropTypes.object.isRequired,
  extraLinks: PropTypes.array,
  nodeDefLabelType: PropTypes.string,
  onEntityClick: PropTypes.func.isRequired,
}
