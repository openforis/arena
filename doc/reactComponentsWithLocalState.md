> By convention the component is called Component
# store folder
- actions
- state
- useLocalState.js
- index.js

# state
- keys.js
- create.js
- read.js
- update.js
- delete.js
- index.js

OR
- state.js
- index.js

index.js (complex states)
```javascript
import { create } from './create'
import { getProp1 } from './read'
import { assocProp1 } from './update'

export const State = {
  create,
  getProp1,
  assocProp1,
}
```

index.js (simple states)
```javascript
import * as State from './state'
export { State }
```

# actions
- useAction1.js
- ...otherActions.js
- index.js

index.js
```javascript
import { State } from '../state'
import { useAction1 } from './useAction1'

export const useActions({ setState }) => ({
  action1: useAction1({ setState})
})
```

useActions1.js
```javascript
import { State } from '../state'

export const useActions1 = ({ setState }) => {
    ...
    return useCallback(({}) => {
        ...
        setState((state)=> {
            const stateUpdated = State.assocSomething(propUpdated)(state)
            return stateUpdated
        })
    }, [])
}
```

# useLocalState.js
```javascript
import { useState } from 'react'

export const useLocalState = ({prop1, prop2...}) => {
  const [state, setState] = useState(() => State.create({prop1,...}))

  return { state, setState }
}
```

# index.js
```javascript
import { State } from './state'
import { useLocalState } from './useLocalState'
import { useActions } from './actions'

export { State, useLocalState, useActions }
```

# Component.js
```javascript
import React from 'react'
...
import SubComponent from './SubComponent'
import { State, useLocalState, useActions } from './store'

const Component = (props) => {
  const { prop1, prop2 } = props
  const { state, setState } = useLocalState({ prop1, prop2 })
  const Actions = useActions({ setState })

  return (
    <div>
      <SubComponent state={state} setState={setState}/>
      <button onClick={Actions.updateSometing()}>a button</button>      
    </div>
  )
}
```

# SubComponent.js
```javascript
import React from 'react'
...
import SubSubComponent from './SubSubComponent'
import { State, useActions } from '../store'

const SubComponent = (props) => {
  const { state, setState } = props
  const Actions = useActions({ setState })

  return (
    <div>
      <SubSubComponent state={state} setState={setState}/>
      <button onClick={Actions.updateSometing()}>a subcomopnent button</button>      
    </div>
    )
}
```
