import React from 'react'
import PropTypes from 'prop-types'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useUserIsSystemAdmin } from '@webapp/store/user'

export const defaultChunkSize = 1024 * 1024 * 10

const chunkSizeItems = [
  { value: defaultChunkSize, label: '10 MB' },
  { value: 1024 * 1024 * 100, label: '100 MB' },
  { value: 1024 * 1024 * 1024, label: '1 GB' },
  { value: '', label: 'Not set' },
]

/**
 * Dropdown for selecting file upload chunk size. Only rendered for system administrators.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Optional CSS class for the wrapping FormItem.
 * @param {Function} props.onChange - Callback invoked with the selected chunk size value.
 * @param {number|string} props.value - Currently selected chunk size value.
 * @returns {React.JSX.Element|null} The chunk size dropdown or null if not a system admin.
 */
export const FileUploadChunkSizeDropdown = ({ className, onChange, value }) => {
  const userIsSystemAdmin = useUserIsSystemAdmin()

  if (!userIsSystemAdmin) return null

  return (
    <FormItem className={className} label="dataImportView.fileUploadChunkSize.label">
      <Dropdown
        className="chunk-size-dropdown"
        clearable={false}
        items={chunkSizeItems}
        itemValue={(item) => item.value}
        onChange={(item) => onChange(item.value)}
        selection={chunkSizeItems.find((item) => item.value === value)}
      />
    </FormItem>
  )
}

FileUploadChunkSizeDropdown.propTypes = {
  className: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
}
