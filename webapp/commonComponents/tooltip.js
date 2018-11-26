import './tooltip.scss'

import React from 'react'
import * as R from 'ramda'

const Tooltip = ({children, type = null, messages = []}) => {

  const hasMessages = !R.isEmpty(messages)

  return <div className={hasMessages ? `tooltip${type ? '-' + type : ''}` : ''}
              style={{display: 'grid', width: '100%', height: '100%'}}>

    <React.Fragment>
      {children}

      {
        hasMessages
          ? (
            <div className="tooltip-text">
              {
                messages.map((msg, i) =>
                  <div key={i}>{msg}</div>
                )
              }
            </div>
          )
          : null
      }
    </React.Fragment>

  </div>

}

export const TooltipError = (props) => (
  <Tooltip {...props}
           type="error"/>
)

export default Tooltip