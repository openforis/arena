import React, { useRef } from 'react'
import type { ReactElement } from 'react'

import { TestId } from '@webapp/utils/testId'

import { UPLOAD_ACCEPT } from '../uploaded/uploadedFiles'
import { useUploadMapFile } from '../uploaded/useUploadMapFile'
import { MenuActionItem } from './menuItems'
import { ToolbarMenu } from './ToolbarMenu'

/**
 * Add data menu (full bar): upload a file; Part 3 adds the WMS / WMTS service item.
 * @returns {React.ReactElement} The menu and its hidden file input.
 */
export const AddDataMenu = (): ReactElement => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const uploadMapFile = useUploadMapFile()

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={UPLOAD_ACCEPT}
        data-testid={TestId.mapWorkspace.uploadInput}
        onChange={(event) => {
          const file = event.target.files?.[0]
          // the same file can be chosen again
          event.target.value = ''
          if (file) void uploadMapFile(file)
        }}
      />
      <ToolbarMenu menuKey="addData" labelKey="mapWorkspace.menus.addData" iconClassName="icon-upload2">
        {(close) => [
          <MenuActionItem
            key="uploadFile"
            itemKey="uploadFile"
            labelKey="mapWorkspace.addData.uploadFile"
            onClick={() => {
              // the file chooser opens only from the click itself (user gesture)
              inputRef.current?.click()
              close()
            }}
          />,
        ]}
      </ToolbarMenu>
    </>
  )
}
