import PropTypes from 'prop-types'

import { SortToggle } from '@webapp/components/Table'
import { useI18n } from '@webapp/store/system'

const RowHeader = ({ handleSortBy, sort }) => {
  const i18n = useI18n()

  return (
    <>
      <div>#</div>
      <div>
        <SortToggle sort={sort} handleSortBy={handleSortBy} field="path" />
        {i18n.t('common.path')}
      </div>
      <div>
        <SortToggle sort={sort} handleSortBy={handleSortBy} field="message" />
        {i18n.t('common.message_plural')}
      </div>
      <div>
        <SortToggle sort={sort} handleSortBy={handleSortBy} field="owner" />
        {i18n.t('common.owner')}
      </div>
      <div />
    </>
  )
}

RowHeader.propTypes = {
  handleSortBy: PropTypes.func.isRequired,
  sort: PropTypes.object.isRequired,
}

export default RowHeader
