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
 * membership has no persisted order. Sortable relocates the dragged element into the destination
 * column's real DOM node as part of finishing the drag gesture, independent of React - but that
 * move happens synchronously *after* the `sortable:stop` listener returns (Sortable's own
 * internal drag-stop handling inserts the real element into place only once every `sortable:stop`
 * subscriber, including this hook's, has already run - see Draggable's `[dragStop]`). The
 * cross-column handling below is therefore deferred to a microtask, so it runs once that
 * synchronous continuation has completed and the element has actually been relocated; only then
 * is it safe to move it back to its original column so the DOM still matches what React currently
 * believes is true, letting the subsequent state-driven re-render (whether onChangeUserGroup
 * succeeds or, via the reload fallback, if it fails) reconcile the real move safely instead of
 * crashing on a stale DOM parent reference.
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

  // Sortable's `sortable:stop` listener is registered once, when the Sortable instance is
  // constructed (see the effect below) - it does NOT re-run on every render, only when the set
  // of columns changes shape. onChangeUserGroup's identity, however, changes on every successful
  // drag (it depends on groupUuidByUserUuid). Reading onChangeUserGroup/reload through refs kept
  // current on every render means the listener always calls the latest version, instead of a
  // closure captured once and frozen until the next column-shape change - without this, a second
  // drag of the same card in one session would use a stale membership snapshot and silently leave
  // the user in both their old and new group.
  const onChangeUserGroupRef = useRef(onChangeUserGroup)
  const reloadRef = useRef(reload)
  useLayoutEffect(() => {
    onChangeUserGroupRef.current = onChangeUserGroup
    reloadRef.current = reload
  }, [onChangeUserGroup, reload])

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

      const cardElement = event.dragEvent.originalSource
      const userUuid = cardElement.dataset.userUuid
      const groupKeyNew = newContainer.dataset.groupUuid
      if (!userUuid || !groupKeyNew) return

      // Deferred to a microtask: Sortable's own drag-stop handling (Draggable's base class)
      // synchronously continues running after this listener returns, and it's that trailing
      // code - not anything that already happened before this listener fired - that physically
      // moves cardElement's real DOM node into newContainer. Reverting the move here, before that
      // continuation runs, would revert nothing: the move hasn't happened yet, and the library
      // would immediately redo it right after, undoing the revert. Queuing a microtask guarantees
      // this code runs only once that synchronous continuation (and any other same-tick 'drag:stop'
      // subscribers) has fully finished, i.e. once the move has actually happened.
      queueMicrotask(() => {
        // Sortable has now physically moved cardElement into newContainer as part of finishing the
        // drag gesture, independent of React. React still believes the card belongs to oldContainer
        // (nothing has re-rendered yet), so its next reconciliation - triggered by the reload()
        // that onChangeUserGroup runs internally on success, or by the reload() below on failure -
        // would try to remove the card from oldContainer by calling oldContainer.removeChild() on
        // a node whose actual DOM parent is now newContainer, which throws. Moving the card back
        // to oldContainer here, before React gets a chance to reconcile, keeps the DOM consistent
        // with what React last rendered; the resulting state update then drives the real move.
        oldContainer.appendChild(cardElement)

        const groupUuidNew = groupKeyNew === unassignedGroupKey ? null : groupKeyNew

        onChangeUserGroupRef.current(userUuid, groupUuidNew).catch(() => {
          reloadRef.current().catch(() => {})
        })
      })
    })

    return () => {
      sortable.destroy()
    }
    // columnKeys is read via its joined form so the effect only reinitializes Sortable when the
    // set of columns actually changes shape, not on every unrelated re-render. onChangeUserGroup/
    // reload are intentionally excluded too - see onChangeUserGroupRef/reloadRef above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, columnKeys.join('|')])

  return { registerColumnRef }
}
