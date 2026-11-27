import classNames from 'classnames'

import { Button } from '@webapp/components/buttons'
import { State } from '../store'

import DataQueriesPanel from './DataQueriesPanel'

type ButtonManageQueriesProps = {
  disabled?: boolean
  state: Record<string, any>
  Actions: Record<string, any>
}

const ButtonManageQueries = (props: ButtonManageQueriesProps) => {
  const { disabled = false, state, Actions } = props

  return (
    <>
      <Button
        className={classNames('btn-s', 'btn-edit')}
        disabled={disabled}
        iconName="list"
        iconSize={16}
        onClick={Actions.togglePanelQueries}
        label="dataView:dataQuery.manageQueries"
      />

      {State.isPanelQueriesShown(state) && <DataQueriesPanel onClose={Actions.togglePanelQueries} />}
    </>
  )
}

export default ButtonManageQueries
