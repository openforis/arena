import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import type { ScreenshotImageAttributeOption } from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

/**
 * Creates a filter for the attributes that can hold a screenshot: image file attributes, editable, in the cycle.
 * @param {string} cycle - The survey cycle key.
 * @returns {Function} A predicate taking a node definition.
 */
export const isImageAttributeDefForScreenshot =
  (cycle: string) =>
  (def: any): boolean =>
    NodeDef.isFile(def) &&
    NodeDef.getFileType(def) === NodeDef.fileTypeValues.image &&
    !NodeDef.isReadOnly(def) &&
    !NodeDef.isAnalysis(def) &&
    NodeDef.isInCycle(cycle)(def)

/**
 * Keeps the attributes that can hold a screenshot.
 * @param {Array<object>} defs - Node definitions.
 * @param {string} cycle - The survey cycle key.
 * @returns {Array<object>} The image file attributes that can be edited in the cycle.
 */
export const filterImageAttributeDefs = (defs: any[], cycle: string): any[] =>
  defs.filter(isImageAttributeDefForScreenshot(cycle))

/**
 * Turns image attributes into the options of the attribute picker.
 * @param {Array<object>} defs - Image attribute definitions.
 * @param {string} lang - Survey language for the labels.
 * @returns {Array<ScreenshotImageAttributeOption>} The options.
 */
export const toImageAttributeOptions = (defs: any[], lang: string): ScreenshotImageAttributeOption[] =>
  defs.map((def) => ({
    uuid: NodeDef.getUuid(def),
    parentUuid: NodeDef.getParentUuid(def),
    label: NodeDef.getLabel(def, lang),
    multiple: NodeDef.isMultiple(def),
    maxFileSizeMb: NodeDef.getMaxFileSize(def),
  }))

/**
 * Finds the image attributes of a plot entity: its own and those of its single entity descendants.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.entityDefUuid - Uuid of the plot entity definition.
 * @param {string} params.cycle - The survey cycle key.
 * @returns {Array<object>} The image attribute definitions, in form order.
 */
export const getImageAttributeDefs = ({
  survey,
  entityDefUuid,
  cycle,
}: {
  survey: any
  entityDefUuid: string
  cycle: string
}): any[] => {
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  if (!entityDef) return []
  const descendants = Survey.getNodeDefDescendantAttributesInSingleEntities({
    nodeDef: entityDef,
    includeMultipleAttributes: true,
    sorted: true,
    cycle,
  })(survey)
  return filterImageAttributeDefs(descendants, cycle)
}
