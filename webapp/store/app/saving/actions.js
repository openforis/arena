import Counter from '@core/counter'

export const APP_SAVING_UPDATE = 'app/saving/update'
const counter = new Counter()

export const showAppSaving = () => (dispatch) => {
  if (counter.count === 0) {
    dispatch({ type: APP_SAVING_UPDATE, saving: true })
  }

  counter.increment()
}

export const hideAppSaving = () => (dispatch) => {
  counter.decrement()
  if (counter.count === 0) {
    dispatch({ type: APP_SAVING_UPDATE, saving: false })
  }
}
