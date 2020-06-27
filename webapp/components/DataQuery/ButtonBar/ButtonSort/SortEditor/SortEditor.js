import './sortEditor.scss'
import React from 'react'
import PropTypes from 'prop-types'

import PanelRight from '@webapp/components/PanelRight'
import { useI18n } from '@webapp/store/system'
import { Sort } from '@common/model/query'

import { useSortEditor } from './store'

const SortEditor = (props) => {
  const { onChange, onClose, sort } = props

  const i18n = useI18n()
  const { draft, sortDraft } = useSortEditor({ sort })

  return (
    <PanelRight onClose={onClose} header={i18n.t('common.orderBy')}>
      <div className="sort-editor">
        {sortDraft.map((sortCriteria) => (
          <div>{sortCriteria}</div>
        ))}

        <div className="button-bar">
          <button
            type="button"
            className="btn btn-s"
            onClick={() => onChange(Sort.create())}
            aria-disabled={Sort.isEmpty(sort)}
          >
            <span className="icon icon-undo2 icon-12px icon-left" />
            {i18n.t('common.reset')}
          </button>

          <button
            type="button"
            className="btn btn-s btn-primary"
            onClick={() => onChange(sortDraft)}
            aria-disabled={!draft}
          >
            <span className="icon icon-checkmark icon-12px icon-left" />
            {i18n.t('common.apply')}
          </button>
        </div>
      </div>
    </PanelRight>
  )
}

SortEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  sort: PropTypes.array.isRequired,
}

export default SortEditor
