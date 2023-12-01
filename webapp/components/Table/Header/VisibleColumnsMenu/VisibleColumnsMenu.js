import './VisibleColumnsMenu.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { ArrayUtils } from '@core/arrayUtils'

import { ButtonMenu } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'

export const VisibleColumnsMenu = (props) => {
  const { columns, onSelectionChange, selectedColumnKeys } = props

  const availableColumns = columns.filter((column) => !Objects.isEmpty(column.header) && column.header !== '#')

  const onColummSelectionChange = useCallback(
    (key) => () => {
      const selectedColumnKeysNext = ArrayUtils.addOrRemoveItem({ item: key })(selectedColumnKeys)
      onSelectionChange(selectedColumnKeysNext)
    },
    [onSelectionChange, selectedColumnKeys]
  )

  return (
    <ButtonMenu
      className="btn-s"
      closeMenuOnItemClick={false}
      iconClassName="icon-cog"
      items={availableColumns.map((column) => {
        const { key, header } = column
        const selected = selectedColumnKeys.includes(key)
        return {
          key: `visible-column-${key}`,
          content: (
            <Checkbox
              className="visible-column-checkbox"
              label={header}
              checked={selected}
              onChange={onColummSelectionChange(key)}
            />
          ),
        }
      })}
      label="common.table.visibleColumns"
      menuClassName="visible-columns-menu"
    />
  )
}

VisibleColumnsMenu.propTypes = {
  columns: PropTypes.array.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  selectedColumnKeys: PropTypes.array,
}
