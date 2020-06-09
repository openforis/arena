import { exportReducer } from '@webapp/utils/reduxUtils'

import { appPropsChange } from '@webapp/app/actions'

const actionHandlers = {
  [appPropsChange]: (state, { status }) => status || state,
}

export default exportReducer(actionHandlers)
