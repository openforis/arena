import React from 'react'

import * as CollectImportReportItem from '@core/survey/collectImportReportItem'

import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import Checkbox from '@webapp/components/form/checkbox'

import { useCollectImportReportItem } from './store'

const Row = (props) => {
  const { rowNo, row, type, nodeDefPath, onUpdate } = useCollectImportReportItem(props)
  const { icon: typeIcon, label: typeLabel } = type

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
        <span className="icon icon-12px icon-pencil2" />
      </div>
    </>
  )
}

export default Row
