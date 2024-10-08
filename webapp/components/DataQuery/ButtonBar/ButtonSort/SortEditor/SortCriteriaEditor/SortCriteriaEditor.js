import './sortCriteriaEditor.scss'
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { SortCriteria } from '@common/model/query'

import Dropdown from '@webapp/components/form/Dropdown'
import { Button, ButtonIconClose } from '@webapp/components/buttons'

const titleKeyByOrder = {
  [SortCriteria.orders.asc]: 'common.ascending',
  [SortCriteria.orders.desc]: 'common.descending',
}

const SortCriteriaEditor = (props) => {
  const { onChange, onDelete = null, placeholder = false, sortCriteria, variables, variablesAvailable } = props
  const selection = placeholder ? null : variables.find(({ value }) => value === SortCriteria.getVariable(sortCriteria))

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
        {Object.values(SortCriteria.orders).map((order) => (
          <Button
            key={order}
            disabled={placeholder}
            className={classNames('btn-xs', { active: !placeholder && SortCriteria.getOrder(sortCriteria) === order })}
            onClick={() => onChange(SortCriteria.assocOrder(order)(sortCriteria))}
            iconClassName={`icon-sort-amount-${order}`}
            title={placeholder ? null : titleKeyByOrder[order]}
          />
        ))}
      </div>

      <ButtonIconClose disabled={placeholder} onClick={onDelete} />
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

export default SortCriteriaEditor
