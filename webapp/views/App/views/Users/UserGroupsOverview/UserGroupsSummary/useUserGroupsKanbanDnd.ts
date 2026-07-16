import { useCallback, useLayoutEffect, useRef } from 'react'
import { Sortable } from '@shopify/draggable'
import type { SortableStopEvent } from '@shopify/draggable'

type OnChangeUserGroup = (userUuid: string, groupUuidNew: string | null) => Promise<void>

interface UseUserGroupsKanbanDndParams {
  enabled: boolean
  columnKeys: string[]
  onChangeUserGroup: OnChangeUserGroup
  reload: () => Promise<void>
  unassignedGroupKey: string
}

interface UseUserGroupsKanbanDndResult {
  registerColumnRef: (groupKey: string) => (el: HTMLUListElement | null) => void
}

/**
 * Wires up cross-column drag-and-drop for the UserGroupsSummary Kanban board, using
 * @shopify/draggable's Sortable (which natively supports multiple containers). Dropping a user
 * card into a different column calls onChangeUserGroup with the target column's group uuid (or
 * null for the Unassigned column). Dropping within the same column is a no-op, since group
 * membership has no persisted order. If onChangeUserGroup rejects, reload is called so the
 * resulting re-render (new state references from the hook's own reload) snaps the card's DOM
 * position back to its true, unchanged column - Sortable moves the dragged element directly in
 * the DOM as part of the drag gesture, independent of React, so a failed mutation needs this
 * explicit resync.
 *
 * @param params0 - The hook parameters.
 * @param params0.enabled - Whether drag-and-drop should be active; when false, Sortable is never instantiated and cards render inert.
 * @param params0.columnKeys - The current ordered list of column keys (group uuids plus the unassigned sentinel); Sortable is reinitialized whenever this list changes shape.
 * @param params0.onChangeUserGroup - Called with the dragged user's uuid and the destination column's group uuid (or null) on a cross-column drop.
 * @param params0.reload - Re-fetches board data; called if onChangeUserGroup rejects, to force a state-driven re-render that reconciles the DOM.
 * @param params0.unassignedGroupKey - The sentinel value used as the Unassigned column's data-group-uuid, mapped to null before calling onChangeUserGroup.
 * @returns {UseUserGroupsKanbanDndResult} An object exposing registerColumnRef, used to obtain a stable callback ref for each column's drop-target element.
 */
export const useUserGroupsKanbanDnd = (params: UseUserGroupsKanbanDndParams): UseUserGroupsKanbanDndResult => {
  const { enabled, columnKeys, onChangeUserGroup, reload, unassignedGroupKey } = params

  const containersByKeyRef = useRef<Map<string, HTMLUListElement>>(new Map())

  const registerColumnRef = useCallback(
    (groupKey: string) =>
      (el: HTMLUListElement | null): void => {
        if (el) {
          containersByKeyRef.current.set(groupKey, el)
        } else {
          containersByKeyRef.current.delete(groupKey)
        }
      },
    []
  )

  useLayoutEffect(() => {
    if (!enabled) return undefined

    const containers = Array.from(containersByKeyRef.current.values())
    if (containers.length === 0) return undefined

    const sortable = new Sortable(containers, {
      draggable: '.user-card--draggable',
      mirror: {
        appendTo: 'body',
        constrainDimensions: true,
      },
    })

    sortable.on('sortable:stop', (event: SortableStopEvent) => {
      const { oldContainer, newContainer } = event
      if (newContainer === oldContainer) return

      const userUuid = event.dragEvent.originalSource.dataset.userUuid
      const groupKeyNew = newContainer.dataset.groupUuid
      if (!userUuid || !groupKeyNew) return

      const groupUuidNew = groupKeyNew === unassignedGroupKey ? null : groupKeyNew

      onChangeUserGroup(userUuid, groupUuidNew).catch(() => {
        reload()
      })
    })

    return () => {
      sortable.destroy()
    }
    // columnKeys is read via its joined form so the effect only reinitializes Sortable when the
    // set of columns actually changes shape, not on every unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, columnKeys.join('|')])

  return { registerColumnRef }
}
