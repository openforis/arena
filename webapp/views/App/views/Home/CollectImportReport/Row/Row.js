import React, { useCallback } from 'react'
import { useNavigate } from 'react-router'

import * as CollectImportReportItem from '@core/survey/collectImportReportItem'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { ButtonIconEdit } from '@webapp/components'
import Checkbox from '@webapp/components/form/checkbox'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

import { useCollectImportReportItem } from './store'

const Row = (props) => {
  const navigate = useNavigate()
  const { rowNo, row, type, nodeDefPath, onUpdate } = useCollectImportReportItem(props)
  const { icon: typeIcon, label: typeLabel } = type

  const onEditClick = useCallback(() => {
    const nodeDefUuid = CollectImportReportItem.getNodeDefUuid(row)
    navigate(`${appModuleUri(designerModules.nodeDef)}${nodeDefUuid}/`)
  }, [row])

  return (
    <>
      <div>{rowNo}</div>
      <div className="full-width">{nodeDefPath}</div>
      <div>
        {typeIcon}
        {typeLabel}
      </div>
      <div className="full-width">{CollectImportReportItem.getExpression(row)}</div>
      <div className="full-width">{CollectImportReportItem.getApplyIf(row)}</div>
      <div className="full-width">
        <LabelsEditor
          labels={CollectImportReportItem.getMessages(row)}
          readOnly
          showFormLabel={false}
          maxPreview={1}
          compactLanguage
        />
      </div>
      <div>
        <Checkbox
          checked={CollectImportReportItem.isResolved(row)}
          onChange={(checked) => onUpdate({ resolved: checked })}
        />
      </div>
      <div className="cell icon">
        <ButtonIconEdit onClick={onEditClick} />
      </div>
    </>
  )
}

export default Row
