import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as RecordCore from '@core/record/record'

export type PagesUuidMap = Record<string, string>

type GetPageEntityParams = {
  survey: object
  record: object
  pagesUuidMap?: PagesUuidMap
  pageNodeDefUuid: string
}

type GetPageEntityFromParentParams = {
  pageNodeDef: object
  pageNodeDefUuid: string
  parentDefUuid: string
  pagesUuidMap?: PagesUuidMap
  record: object
  survey: object
}

/**
 * Resolves a page entity via its parent entity in the record.
 * Falls back to the first parent instance only when the parent is single —
 * never for multiples (must be selected via pagesUuidMap).
 *
 * @param params - Parent and page context
 * @returns Child page entity, or null
 */
export const getPageEntityFromParent = ({
  pageNodeDef,
  pageNodeDefUuid,
  parentDefUuid,
  pagesUuidMap,
  record,
  survey,
}: GetPageEntityFromParentParams) => {
  const parentDef = Survey.getNodeDefByUuid(parentDefUuid)(survey)
  const parentMappedUuid = pagesUuidMap?.[parentDefUuid]
  let parentEntity = parentMappedUuid ? RecordCore.getNodeByUuid(parentMappedUuid)(record) : null
  if (!parentEntity && parentDef && !NodeDef.isMultiple(parentDef)) {
    parentEntity = RecordCore.getNodesByDefUuid(parentDefUuid)(record)?.[0] ?? null
  }
  if (!parentEntity) return null

  const children = RecordCore.getNodeChildrenByDefUuid(parentEntity, pageNodeDefUuid)(record)
  // Multiple page entities under a parent must be selected via pagesUuidMap.
  if (NodeDef.isMultiple(pageNodeDef)) return null
  return children?.[0] ?? null
}

/**
 * Resolves the page entity node for a page definition.
 * Uses pagesUuidMap when present; otherwise falls back to the first record
 * instance only for single entities — never for multiples.
 *
 * @param params - Survey, record, selection map, and page def UUID
 * @returns Page entity node, or null when unresolved
 */
export const getPageEntity = ({ survey, record, pagesUuidMap, pageNodeDefUuid }: GetPageEntityParams) => {
  if (!record) return null

  const mappedUuid = pagesUuidMap?.[pageNodeDefUuid]
  if (mappedUuid) {
    const mappedEntity = RecordCore.getNodeByUuid(mappedUuid)(record)
    if (mappedEntity) return mappedEntity
  }

  const pageNodeDef = Survey.getNodeDefByUuid(pageNodeDefUuid)(survey)
  if (!pageNodeDef) return null

  const parentDefUuid = NodeDef.getParentUuid(pageNodeDef)
  if (parentDefUuid) {
    return getPageEntityFromParent({
      pageNodeDef,
      pageNodeDefUuid,
      parentDefUuid,
      pagesUuidMap,
      record,
      survey,
    })
  }

  if (NodeDef.isMultiple(pageNodeDef)) return null
  return RecordCore.getNodesByDefUuid(pageNodeDefUuid)(record)?.[0] ?? null
}

/**
 * True when a multiple ancestor lacks a pagesUuidMap entry (scope cannot be resolved).
 *
 * @param pageNodeDef - Page node def
 * @param survey - Survey
 * @param pagesUuidMap - Active page entity map
 * @returns True when a multiple ancestor is unresolved
 */
export const hasUnresolvedMultipleAncestor = (
  pageNodeDef: object,
  survey: object,
  pagesUuidMap?: PagesUuidMap
): boolean => {
  let currentDef: object | null | undefined = pageNodeDef
  while (currentDef) {
    const parentDef = Survey.getNodeDefParent(currentDef)(survey)
    if (!parentDef) break
    if (NodeDef.isMultiple(parentDef)) {
      const parentDefUuid = NodeDef.getUuid(parentDef)
      if (!pagesUuidMap?.[parentDefUuid]) {
        return true
      }
    }
    currentDef = parentDef
  }
  return false
}

/**
 * Resolves the ancestor entity UUID that scopes aggregation for a multiple page.
 * Nested multiples (e.g. Tree under Plot) must only aggregate instances under the
 * currently selected parent — never sibling parents.
 *
 * @param params - Survey, record, selection map, and multiple page node def
 * @returns Parent entity UUID, or null when the parent cannot be resolved
 */
export const getMultiplePageScopeEntityUuid = ({
  survey,
  record,
  pagesUuidMap,
  pageNodeDef,
}: {
  survey: object
  record: object
  pagesUuidMap?: PagesUuidMap
  pageNodeDef: object
}): string | null => {
  const parentDefUuid = NodeDef.getParentUuid(pageNodeDef)
  if (!parentDefUuid) return null

  const parentEntity = getPageEntity({ survey, record, pagesUuidMap, pageNodeDefUuid: parentDefUuid })
  return parentEntity ? Node.getUuid(parentEntity) : null
}
