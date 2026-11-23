import PropTypes from 'prop-types'

export const TableColumnPropType = PropTypes.shape({
  key: PropTypes.string.isRequired,
  header: PropTypes.string,
  renderHeader: PropTypes.func,
  headerIsTranslationKey: PropTypes.bool,
  sortable: PropTypes.bool,
  sortField: PropTypes.string,
})
