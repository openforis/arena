import React, { useCallback } from 'react'

import * as A from '@core/arena'

import { useI18nT } from '@webapp/store/system'
import { Dropdown } from '@webapp/components/form'

import { TableConstants } from '../../constants'

type Props = {
  disabled?: boolean
  limit: number
  setLimit: (limit: number) => void
}

export const ItemsPerPageSelector = (props: Props) => {
  const { disabled = false, limit, setLimit } = props

  const t = useI18nT()

  const onChange = useCallback(
    (limitUpdated: number | string) => {
      const limitUpdatedNumber = Number(limitUpdated)
      const limitNext = TableConstants.itemsPerPageValues.includes(limitUpdatedNumber)
        ? limitUpdatedNumber
        : TableConstants.itemsPerPageDefault
      setLimit(limitNext)
    },
    [setLimit]
  )

  return (
    <div className="table__paginator-items-per-page">
      <div className="label">{t('common.paginator.itemsPerPage')}:</div>
      <Dropdown
        clearable={false}
        disabled={disabled}
        items={TableConstants.itemsPerPageValues}
        itemValue={A.identity}
        itemLabel={A.identity}
        selection={limit}
        onChange={onChange}
      />
    </div>
  )
}
