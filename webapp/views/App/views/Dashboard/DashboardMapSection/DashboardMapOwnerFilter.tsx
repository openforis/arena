import React, { useCallback, useMemo } from 'react'

import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'

import type { DashboardMapOwner } from './useDashboardMapOwners'

type DashboardMapOwnerFilterProps = {
  owners: DashboardMapOwner[]
  selectedOwnerUuid: string | null
  onOwnerSelect: (ownerUuid: string | null) => void
}

/**
 * Dropdown narrowing the map features to the records of a single owner.
 *
 * @param {DashboardMapOwnerFilterProps} props - The component props.
 * @returns {React.ReactElement} The filter, or null when there is no owner to filter by.
 */
export const DashboardMapOwnerFilter = (props: DashboardMapOwnerFilterProps) => {
  const { owners, selectedOwnerUuid, onOwnerSelect } = props
  const i18n = useI18n()

  const selection = useMemo(
    () => owners.find((owner) => owner.uuid === selectedOwnerUuid) ?? null,
    [owners, selectedOwnerUuid]
  )

  const onChange = useCallback(
    (owner?: DashboardMapOwner | null) => onOwnerSelect(owner?.uuid ?? null),
    [onOwnerSelect]
  )

  if (owners.length < 2) {
    // nothing to narrow down
    return null
  }

  return (
    <div className="dashboard-map-section__owner-filter">
      <span className="dashboard-map-section__owner-filter-label">{i18n.t('common.owner') as string}</span>
      <Dropdown
        items={owners}
        itemLabel="label"
        itemValue="uuid"
        onChange={onChange}
        placeholder={i18n.t('homeView:dashboard.map.allOwners') as string}
        selection={selection}
      />
    </div>
  )
}
