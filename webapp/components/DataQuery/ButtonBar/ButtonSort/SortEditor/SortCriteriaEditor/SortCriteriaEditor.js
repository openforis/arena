import './sortCriteriaEditor.scss'
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { SortCriteria } from '@common/model/query'

import { useI18n } from '@webapp/store/system'

import Dropdown from '@webapp/components/form/Dropdown'
import Tooltip from '@webapp/components/tooltip'

const SortCriteriaEditor = (props) => {
  const { onChange, onDelete, placeholder, sortCriteria, variables, variablesAvailable } = props
  const selection = placeholder ? null : variables.find(({ value }) => value === SortCriteria.getVariable(sortCriteria))

  const i18n = useI18n()

  return (
    <div className="sort-criteria-editor">
      <Dropdown
        items={selection ? [...variablesAvailable, selection] : variablesAvailable}
        selection={selection}
        onChange={(variable) =>
          variable &&
          onChange(SortCriteria.assocVariable({ variable: variable.value, label: variable.label })(sortCriteria))
        }
      />

      <div className="sort-criteria-editor__order">
        <Tooltip messages={placeholder ? null : [i18n.t('common.ascending')]}>
          <button
            type="button"
            aria-disabled={placeholder}
            className={classNames('btn', 'btn-xs', { active: !placeholder && SortCriteria.isOrderAsc(sortCriteria) })}
            onClick={() => onChange(SortCriteria.assocOrderAsc(sortCriteria))}
          >
            <span className="icon icon-sort-amount-asc icon-14px" />
          </button>
        </Tooltip>

        <Tooltip messages={placeholder ? null : [i18n.t('common.descending')]}>
          <button
            type="button"
            aria-disabled={placeholder}
            className={classNames('btn', 'btn-xs', { active: !placeholder && SortCriteria.isOrderDesc(sortCriteria) })}
            onClick={() => onChange(SortCriteria.assocOrderDesc(sortCriteria))}
          >
            <span className="icon icon-sort-amount-desc icon-14px" />
          </button>
        </Tooltip>
      </div>

      <button type="button" className="btn btn-xs btn-transparent" onClick={onDelete} aria-disabled={placeholder}>
        <span className="icon icon-cross icon-10px" />
      </button>
    </div>
  )
}

SortCriteriaEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  placeholder: PropTypes.bool,
  sortCriteria: PropTypes.object.isRequired,
  variables: PropTypes.array.isRequired,
  variablesAvailable: PropTypes.array.isRequired,
}

SortCriteriaEditor.defaultProps = {
  onDelete: null,
  placeholder: false,
}

export default SortCriteriaEditor
