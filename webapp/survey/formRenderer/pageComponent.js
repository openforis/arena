import React from 'react'

class PageComponent extends React.Component {

  render () {

    const {
      entityDef,
      pageDef
    } = this.props

    return (
      <div className="page">
        fgerwgtyerwgterw
      </div>
    )
  }

}

PageComponent.defaultProps = {
  surveyId: -1,

  entityDef: null,

  pageDef: null,

  level: 0,
}

export default PageComponent
