import './sortEditor.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { Sort, SortCriteria } from '@common/model/query'

import PanelRight from '@webapp/components/PanelRight'
import { useI18n } from '@webapp/store/system'

import SortCriteriaEditor from './SortCriteriaEditor'
import { useSortEditor } from './store'

const SortEditor = (props) => {
  const { onChange, onClose, query } = props

  const i18n = useI18n()
  const { draft, sort, sortDraft, setSortDraft, variables, variablesAvailable } = useSortEditor({ query })

  return (
    <PanelRight onClose={onClose} header={i18n.t('common.orderBy')}>
      <div className="sort-editor">
        {sortDraft.map((sortCriteria, idx) => (
          <SortCriteriaEditor
            key={String(idx)}
            onChange={(sortCriteriaUpdated) =>
              setSortDraft(Sort.updateSortCriteria(idx, sortCriteriaUpdated)(sortDraft))
            }
            onDelete={() => setSortDraft(Sort.deleteSortCriteria(idx)(sortDraft))}
            sortCriteria={sortCriteria}
            variables={variables}
            variablesAvailable={variablesAvailable}
          />
        ))}

        {variablesAvailable.length > 0 && (
          <SortCriteriaEditor
            onChange={(sortCriteriaUpdated) => setSortDraft(Sort.addSortCriteria(sortCriteriaUpdated)(sortDraft))}
            sortCriteria={SortCriteria.create()}
            variables={variables}
            variablesAvailable={variablesAvailable}
            placeholder
          />
        )}

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
  query: PropTypes.object.isRequired,
}

export default SortEditor
