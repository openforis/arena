import { isKeyEditDisabled } from '@core/survey/nodeDefEditGuards'

import { useIsMaxKeysCountReached } from './useIsMaxKeysCountReached'

export const useIsKeyEditDisabled = ({ nodeDef }: { nodeDef: any }): boolean => {
  const maxKeysCountReached = useIsMaxKeysCountReached({ nodeDef })

  return isKeyEditDisabled({ nodeDef, maxKeysCountReached })
}
