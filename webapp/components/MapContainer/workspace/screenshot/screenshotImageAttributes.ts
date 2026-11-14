import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import type { ScreenshotImageAttributeOption } from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

/**
 * Creates a filter for the attributes that can hold a screenshot: image file attributes allowing it, editable, in the cycle.
 * @param {string} cycle - The survey cycle key.
 * @returns {Function} A predicate taking a node definition.
 */
export const isImageAttributeDefForScreenshot =
  (cycle: string) =>
  (def: any): boolean =>
    NodeDef.isFile(def) &&
    NodeDef.getFileType(def) === NodeDef.fileTypeValues.image &&
    NodeDef.isScreenCaptureInMapAllowed(def) &&
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
 * @param {object|null} [rowEntityDef] - The multiple entity holding the attributes (a new row gets the image).
 * @returns {Array<ScreenshotImageAttributeOption>} The options.
 */
export const toImageAttributeOptions = (
  defs: any[],
  lang: string,
  rowEntityDef: any = null
): ScreenshotImageAttributeOption[] =>
  defs.map((def) => ({
    uuid: NodeDef.getUuid(def),
    parentUuid: NodeDef.getParentUuid(def),
    label: rowEntityDef
      ? `${NodeDef.getLabel(rowEntityDef, lang)} › ${NodeDef.getLabel(def, lang)}`
      : NodeDef.getLabel(def, lang),
    multiple: NodeDef.isMultiple(def),
    maxFileSizeMb: NodeDef.getMaxFileSize(def),
    rowParentDefUuid: rowEntityDef ? NodeDef.getParentUuid(rowEntityDef) : null,
  }))

/**
 * Finds the image attributes of a plot entity: its own, those of its single entity descendants, and those directly
 * inside its multiple child entities (saved in a new row).
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.entityDefUuid - Uuid of the plot entity definition.
 * @param {string} params.cycle - The survey cycle key.
 * @param {string} params.lang - Survey language for the labels.
 * @returns {Array<ScreenshotImageAttributeOption>} The options, in form order (rows last).
 */
export const getImageAttributeOptions = ({
  survey,
  entityDefUuid,
  cycle,
  lang,
}: {
  survey: any
  entityDefUuid: string
  cycle: string
  lang: string
}): ScreenshotImageAttributeOption[] => {
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  if (!entityDef) return []
  const descendants = Survey.getNodeDefDescendantAttributesInSingleEntities({
    nodeDef: entityDef,
    includeMultipleAttributes: true,
    sorted: true,
    cycle,
  })(survey)
  // shortcut: only attributes directly inside a multiple entity, not in its single entities; extend when a survey needs it
  const rowEntityDefs = Survey.getNodeDefDescendantsInSingleEntities({
    nodeDef: entityDef,
    includeAnalysis: false,
    // enumerated entities get their rows from a category: no row can be added
    filterFn: (def: any) =>
      NodeDef.isMultipleEntity(def) &&
      !NodeDef.isEnumerate(def) &&
      !NodeDef.isReadOnly(def) &&
      NodeDef.isInCycle(cycle)(def),
    sorted: true,
    cycle,
  })(survey)
  const rowOptions = rowEntityDefs.flatMap((rowEntityDef: any) =>
    toImageAttributeOptions(
      filterImageAttributeDefs(Survey.getNodeDefChildrenSorted({ nodeDef: rowEntityDef, cycle })(survey), cycle),
      lang,
      rowEntityDef
    )
  )
  return [...toImageAttributeOptions(filterImageAttributeDefs(descendants, cycle), lang), ...rowOptions]
}
