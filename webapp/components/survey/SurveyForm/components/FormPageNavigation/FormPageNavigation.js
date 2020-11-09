import './FormPageNavigation.scss'

import React from 'react'
import PropTypes from 'prop-types'

import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'

import { State, useLocalState, useActions } from './store'

const FormPageNavigation = (props) => {
  const { state, setState } = useLocalState(props)
  const Actions = useActions({ setState })
  const { itemLabelFunction } = props

  const level = State.getLevel(state)
  const expandedFormPageNavigation = State.getExpandedFormPageNavigation(state)
  const isRoot = State.isRoot(state)
  const outerPageChildDefs = State.getOuterPageChildDefs(state)
  const showChildren = State.getShowChildren(state)
  const active = State.isActive(state)
  const enabled = State.isEnabled(state)
  const edit = State.isEdit(state)
  const label = State.getLabel(state)
  const canEditDef = State.canEditDef(state)
  const surveyCycleKey = State.getSurveyCycleKey(state)

  return (
    <div className={`survey-form__node-def-nav level${level}`} style={{ marginLeft: `${level === 0 ? 0 : 1}rem` }}>
      {isRoot && (
        <div className="display-flex">
          <button type="button" className="btn-xs btn-toggle" onClick={Actions.toggleExpand}>
            <span
              className={classNames('icon icon-12px', {
                'icon-shrink2': expandedFormPageNavigation,
                'icon-enlarge2': !expandedFormPageNavigation,
              })}
            />
          </button>
        </div>
      )}
      <div className="display-flex">
        {outerPageChildDefs.length > 0 ? (
          <button
            type="button"
            className="btn-xs btn-toggle"
            style={{ transform: `rotate(${showChildren ? '90' : '0'}deg)` }}
            onClick={Actions.toggleShowChildren}
          >
            <span className="icon icon-play3 icon-12px" />
          </button>
        ) : (
          <span style={{ marginLeft: '21px' }} />
        )}

        <button
          type="button"
          className={`btn btn-s btn-node-def${active ? ' active' : ''}`}
          onClick={() => Actions.select({ state })}
          aria-disabled={!enabled}
        >
          {label}
        </button>
      </div>

      {showChildren &&
        outerPageChildDefs.map((child) => (
          <FormPageNavigation
            key={NodeDef.getUuid(child)}
            surveyCycleKey={surveyCycleKey}
            level={level + 1}
            nodeDef={child}
            edit={edit}
            canEditDef={canEditDef}
            itemLabelFunction={itemLabelFunction}
          />
        ))}
    </div>
  )
}

FormPageNavigation.propTypes = {
  itemLabelFunction: PropTypes.func,
}

FormPageNavigation.defaultProps = {
  itemLabelFunction: NodeDef.getLabel,
}

export default FormPageNavigation
