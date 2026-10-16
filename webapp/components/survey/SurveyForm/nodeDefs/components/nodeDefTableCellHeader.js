import './nodeDefTableCellHeader.scss'

import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import { valuePropsTaxon } from '@core/survey/nodeValueProps'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { SortToggle } from '@webapp/components/Table'
import { useI18n } from '@webapp/store/system'

import * as NodeDefUiProps from '../nodeDefUIProps'
import NodeDefIconKey from './NodeDefIconKey'
import { NodeDefInfoIcon } from './NodeDefInfoIcon'

const NodeDefTableCellHeader = (props) => {
  const { label, lang, nodeDef, onSortBy, sortCriteria = [] } = props

  const i18n = useI18n()

  const visibleFields = NodeDef.getVisibleFields(nodeDef)
  const fields = NodeDefUiProps.getFormFields(nodeDef).filter(
    (field) => !visibleFields || visibleFields.includes(field.field)
  )

  const getFieldLabelKey = ({ field }) => {
    let labelKey = null
    // use custom field label
    if (NodeDef.isTaxon(nodeDef) && field.field === valuePropsTaxon.vernacularName) {
      labelKey = NodeDef.getVernacularNameLabel(lang)(nodeDef)
    }
    return labelKey || field.labelKey
  }

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const sortable = Boolean(onSortBy) && NodeDef.isAttribute(nodeDef) && !NodeDef.isMultiple(nodeDef)
  const sortCriterionIndex = sortCriteria.findIndex((criterion) => criterion.by === nodeDefUuid)
  const sortToggleSort = {
    by: sortCriterionIndex >= 0 ? nodeDefUuid : null,
    order: sortCriterionIndex >= 0 ? sortCriteria[sortCriterionIndex].order : null,
  }
  const sortPriority = sortCriteria.length > 1 && sortCriterionIndex >= 0 ? sortCriterionIndex + 1 : null

  return (
    <div
      className={`survey-form__node-def-table-cell-header survey-form__node-def-table-cell-${NodeDef.getType(nodeDef)}`}
    >
      <div className="label-wrapper">
        {sortable && (
          <SortToggle sort={sortToggleSort} field={nodeDefUuid} priority={sortPriority} handleSortBy={onSortBy} />
        )}
        <LabelWithTooltip label={label} style={{ gridColumn: `1 / span ${fields.length}` }}>
          <NodeDefIconKey nodeDef={nodeDef} />
        </LabelWithTooltip>
        <NodeDefInfoIcon lang={lang} nodeDef={nodeDef} />
      </div>

      {fields.length > 1 && (
        <div className="subfields-labels-wrapper">
          {fields.map((field) => (
            <div
              key={field.field}
              className={`label ${field.field}`}
              style={{ flex: NodeDefUiProps.getTableColumnFlex(field.field)(nodeDef) }}
            >
              {i18n.t(getFieldLabelKey({ field }))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

NodeDefTableCellHeader.propTypes = {
  label: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  onSortBy: PropTypes.func,
  sortCriteria: PropTypes.array,
}

export default NodeDefTableCellHeader
