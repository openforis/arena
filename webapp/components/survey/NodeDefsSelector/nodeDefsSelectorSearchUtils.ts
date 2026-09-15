import * as NodeDef from '@core/survey/nodeDef'

export type NodeDefFilterFunction = (nodeDef: object) => boolean

/**
 * Creates a filter function matching node definitions whose name or label contains the given search text.
 * @param params - The parameters object.
 * @param params.search - The search text.
 * @param params.lang - The survey preferred language, used to search node definition labels.
 * @returns A filter function accepting a node definition, or null if search text is empty.
 */
export const getNodeDefSearchFilterFunction = ({
  search,
  lang,
}: {
  search: string
  lang: string
}): NodeDefFilterFunction | null => {
  const searchNormalized = (search ?? '').trim().toLowerCase()
  if (!searchNormalized) return null

  return (nodeDef: object) => {
    const nodeDefQueryItems = [NodeDef.getName(nodeDef), NodeDef.getLabel(nodeDef, lang)]
    return nodeDefQueryItems.some((item) => item.toLowerCase().includes(searchNormalized))
  }
}

/**
 * Combines multiple node definition filter functions into a single one matching when every function matches.
 * @param filterFunctions - The filter functions to combine; falsy values are ignored.
 * @returns The combined filter function, or null if no filter function was provided.
 */
export const combineNodeDefFilterFunctions = (
  ...filterFunctions: Array<NodeDefFilterFunction | null | undefined | false>
): NodeDefFilterFunction | null => {
  const filterFunctionsActive = filterFunctions.filter((filterFunction): filterFunction is NodeDefFilterFunction =>
    Boolean(filterFunction)
  )
  if (filterFunctionsActive.length === 0) return null
  return (nodeDef: object) => filterFunctionsActive.every((filterFunction) => filterFunction(nodeDef))
}
