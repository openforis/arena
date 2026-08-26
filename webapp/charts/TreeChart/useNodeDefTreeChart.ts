import { useCallback, useEffect, useRef, type MutableRefObject } from 'react'

import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

interface TreeChartNode {
  data: object
}

interface IconDescriptor {
  className: string
  text: string | null
}

interface Params {
  ref: MutableRefObject<any>
  nodeDefLabelType?: string
}

interface Result {
  i18n: ReturnType<typeof useI18n>
  wrapperRef: MutableRefObject<HTMLDivElement | null>
  nodeLabelFunction: (d: TreeChartNode) => string
  nodeTooltipFunction: (d: TreeChartNode) => string
  nodeIconFunction: (d: TreeChartNode) => IconDescriptor | null
}

/**
 * Provides the label, tooltip and icon accessor functions shared by every TreeChart whose nodes wrap
 * node definitions, and takes care of the chart lifecycle common to all of them (destroy on unmount,
 * keep label/tooltip functions up to date when the language or label type change).
 * The lifecycle effects read the TreeChart instance lazily from `ref.current`, so this hook can be
 * called regardless of whether the chart creation effect runs before or after it.
 * @param {Params} params - Parameters.
 * @returns {Result} i18n instance, wrapper DOM ref, and nodeLabelFunction, nodeTooltipFunction, nodeIconFunction.
 */
export const useNodeDefTreeChart = ({ ref, nodeDefLabelType }: Params): Result => {
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const cycle = useSurveyCycleKey()

  const nodeLabelFunction = useCallback(
    (d: TreeChartNode) => NodeDef.getLabelWithType({ nodeDef: d.data, lang, type: nodeDefLabelType }),
    [lang, nodeDefLabelType]
  )

  const nodeTooltipFunction = useCallback((d: TreeChartNode) => NodeDef.getDescription(lang)(d.data), [lang])

  const nodeIconFunction = useCallback(
    (d: TreeChartNode) => NodeDefUIProps.getIconDescriptorByNodeDef({ nodeDef: d.data, cycle }),
    [cycle]
  )

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => () => ref.current?.destroy(), [ref])

  // force updating labels in TreeChart when label and tooltip function change (depending on lang and labelType)
  // no-op until the TreeChart instance has been created
  useEffect(() => {
    const tree = ref.current
    if (!tree) return
    tree.nodeLabelFunction = nodeLabelFunction
    tree.nodeTooltipFunction = nodeTooltipFunction
  }, [nodeLabelFunction, nodeTooltipFunction, ref])

  return { i18n, wrapperRef, nodeLabelFunction, nodeTooltipFunction, nodeIconFunction }
}
