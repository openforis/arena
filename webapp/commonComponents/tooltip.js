import React from 'react'

const Tooltip = ({children, type = null, message = null}) => (

  <div className={message ? `tooltip${type ? '-' + type : ''}` : ''}
       style={{display: 'grid'}}>

    <React.Fragment>
      {children}
      {
        message
          ? (
            <div className="tooltip-text">
              {message}
            </div>
          )
          : null
      }
    </React.Fragment>

  </div>

)

export const TooltipError = (props) => (
  <Tooltip {...props}
           type="error"/>
)

export default Tooltip