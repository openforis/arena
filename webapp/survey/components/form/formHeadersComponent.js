import React from 'react'

import * as R from 'ramda'

const PageHeaderComponent = ({entityDef}) => {
  const {children = []} = entityDef

  const childPages = R.reject(
    nodeDef => R.isNil(R.path(['layout', 'pageDef'], nodeDef))
  )(children)

  return (
    <React.Fragment>
      <button className="btn btn-of-light">{entityDef.props.name}</button>
      {
        childPages.map(child =>
          <PageHeaderComponent key={child.id} entityDef={child}/>
        )
      }
    </React.Fragment>
  )
}

const FormHeadersComponent = ({entityDef}) => {

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
    }}>
      <PageHeaderComponent entityDef={entityDef}/>
    </div>
  )
}

export default FormHeadersComponent