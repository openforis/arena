import { exportReducer } from '@webapp/utils/reduxUtils'

import { appPropsChange } from '@webapp/app/actions'

const actionHandlers = {
  [appPropsChange]: (state, { i18n }) => i18n,
}

export default exportReducer(actionHandlers)
