import './SortToggle.scss'

import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const tooltipKeyByOrder = {
  asc: 'common.sortDesc',
  desc: 'common.sortNone',
}

const SortToggle = ({ disabled = false, sort, field, handleSortBy }) => {
  const i18n = useI18n()

  const active = sort.by === field
  const tooltipKey = active ? tooltipKeyByOrder[sort.order] : 'common.sortAsc'

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
      title={i18n.t(tooltipKey)}
    >
      <span className="icon icon-play3 icon-10px arrow-toggle" />
    </button>
  )
}

SortToggle.propTypes = {
  disabled: PropTypes.bool,
  sort: PropTypes.object.isRequired,
  field: PropTypes.string.isRequired,
  handleSortBy: PropTypes.func.isRequired,
}

export default SortToggle
