import { catchError, concatMap, delay, map, retryWhen } from 'rxjs/operators'
import { EMPTY, iif, of, throwError } from 'rxjs'

import { ServiceErrorActions } from '@webapp/store/system'

export const fromAjax = ({ ajax, dispatch }) =>
  ajax.pipe(
    retryWhen((errors) =>
      errors.pipe(
        // Use concat map to keep the errors in order and make sure they aren't executed in parallel
        concatMap((error, i) =>
          // Executes a conditional Observable depending on the result of the first argument
          iif(
            () => i > 4, // If it has tried 4 times already throw error
            throwError(error), // Otherwise we pipe this back into our stream and delay the retry
            of(error).pipe(delay(500))
          )
        )
      )
    ),
    catchError(({ response }) => {
      // using axios response error model
      const error = { response: { data: response } }
      dispatch(ServiceErrorActions.createServiceError({ error }))
      return EMPTY
    }),
    map(({ response }) => response)
  )
