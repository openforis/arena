import React from 'react'

class AppHomeView extends React.Component {

  render () {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '.2fr .6fr .2fr',
        gridTemplateRows: '.3fr .7fr',
      }}>

        <div style={{
          gridColumn: '2',

          display: 'grid',
          gridTemplateColumns: '.35fr .35fr .3fr',
          alignItems: 'center',
          gridColumnGap: '2rem',
        }}>
          <input className="form-input" type='input' ref="name" placeholder="Survey name"/>
          <input className="form-input" type='input' ref="label" placeholder="Survey label"/>
          <button className="btn btn-of-light">
            <span className="icon icon-plus icon-left"></span>
            Create Survey
          </button>

        </div>
      </div>
    )
  }
}

export default AppHomeView
