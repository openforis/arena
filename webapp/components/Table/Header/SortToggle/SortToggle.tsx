import './SortToggle.scss'

import { useI18n } from '@webapp/store/system'

const tooltipKeyByOrder = {
  asc: 'common.sortDesc',
  desc: 'common.sortNone',
}

type SortToggleProps = {
  disabled?: boolean
  sort: Record<string, any>
  field: string
  handleSortBy: (...args: any[]) => any
  priority?: number
}

const SortToggle = ({ disabled = false, sort, field, handleSortBy, priority = null }: SortToggleProps) => {
  const i18n = useI18n()

  const active = sort.by === field
  const tooltipKey = (active && tooltipKeyByOrder[sort.order]) || 'common.sortAsc'
  const tooltip = i18n.t(tooltipKey)

  return (
    <button
      type="button"
      className={`
        btn-xs btn-transparent btn-sort-toggle
        ${sort.order || ''}
        ${active ? '' : 'inactive'}
      `}
      disabled={disabled}
      onClick={() => handleSortBy(field)}
      title={tooltip}
      aria-label={tooltip}
      aria-pressed={active}
    >
      <span className="icon icon-play3 icon-10px arrow-toggle" />
      {priority && <span className="btn-sort-toggle-priority">{priority}</span>}
    </button>
  )
}

export default SortToggle
