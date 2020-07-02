> By convention the component is called Component
# store folder
- actions
- state
- useComponent.js
- index.js

#state
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
- ...useAction.js
- index.js

index.js
```javascript
import { State } from '../state'
import { useAction1 } from './useAction1'

export const useActions({ state, setState }) => ({
  action1: useAction1({ state, setState})
})
```

# useComponent.js
```javascript
import { useState } from 'react'

export const useComponent = ({prop1, prop2...}) => {
  const [state, setState] = useState(State.create({prop1,...}))
  const Actions = useActions({state, setState})

  return { state, Actions }
}
```

# index.js
```javascript
import { State } from './state'
import { useComponent } from './useComponent'

export { State, useComponent }
```

# Component.js
```javascript
import React from 'react'
...
import SubComponent from './SubComponent'
import { State, useComponent } from './store'

const Component = (props) => {
  const { prop1, prop2 } = props
  const { Actions, state } = useComponent({prop1, prop2})
  return (
    <div>
      <SubComponent state={state} Actions={Actions}/>
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
import { State } from '../store'

const SubComponent = (props) => {
  const { state, Actions } = props
  return (
    <div>
      <SubSubComponent state={state} Actions={Actions}/>
      <button onClick={Actions.updateSometing()}>a subcomopnent button</button>      
    </div>
    )
}
```

```javascript
{
  chainDraft,
  chainOriginal,
  stepDraft,
  stepOriginal,
  calculationDraft,
  calculationOriginal,
}

const isChainModified = (state) => getChainDraft(state) !== getChainOriginal(state)
```