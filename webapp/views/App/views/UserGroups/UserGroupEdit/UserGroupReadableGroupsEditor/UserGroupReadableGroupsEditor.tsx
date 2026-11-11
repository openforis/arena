import React, { useCallback, useMemo } from 'react'

import { UserGroup as UserGroupType } from '@openforis/arena-core'

import * as UserGroup from '@core/user/userGroup/userGroup'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

type Props = {
  otherGroups: UserGroupType[]
  readableGroupUuids: string[]
  onChange: (readableGroupUuids: string[]) => void
  readOnly?: boolean
}

type GroupItem = { value: string; label: string }

const toItem = (group: UserGroupType): GroupItem => ({
  value: UserGroup.getUuid(group) as string,
  label: UserGroup.getName(group),
})

/**
 * Selector of the other groups of the survey whose records the members of the group can read but not edit.
 *
 * @param props0 - The component props.
 * @param props0.otherGroups - The other groups of the survey.
 * @param props0.readableGroupUuids - Uuids of the currently selected groups.
 * @param props0.onChange - Called with the uuids of the selected groups.
 * @param props0.readOnly - Whether the selection cannot be changed.
 * @returns {React.ReactElement} - The UserGroupReadableGroupsEditor component.
 */
export const UserGroupReadableGroupsEditor = ({
  otherGroups,
  readableGroupUuids,
  onChange,
  readOnly = false,
}: Props): React.ReactElement => {
  const items = useMemo(() => otherGroups.map(toItem), [otherGroups])
  // uuids of deleted groups are ignored
  const selection = useMemo(
    () => items.filter((item) => readableGroupUuids.includes(item.value)),
    [items, readableGroupUuids]
  )
  const onSelectionChange = useCallback(
    (selectedItems: GroupItem[] | null) => onChange((selectedItems ?? []).map((item) => item.value)),
    [onChange]
  )
  return (
    <FormItem label="usersView:userGroup.readableGroups" info="usersView:userGroup.readableGroupsInfo">
      <Dropdown items={items} multiple onChange={onSelectionChange} readOnly={readOnly} selection={selection} />
    </FormItem>
  )
}
