import React from 'react'

import * as R from 'ramda'

const FormPageHeaderComponent = ({entityDef}) => {
  const {children = []} = entityDef

  const childPages = R.reject(
    nodeDef => R.isNil(R.path(['layout', 'pageDef'], nodeDef))
  )(children)

  return (
    <React.Fragment>
      <button className="btn btn-of-light">{entityDef.props.name}</button>
      {
        childPages.map(child =>
          <FormPageHeaderComponent key={child.id} entityDef={child}/>
        )
      }
    </React.Fragment>
  )
}

const FormPageHeadersComponent = ({entityDef}) => {

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
    }}>
      <FormPageHeaderComponent entityDef={entityDef}/>
    </div>
  )
}

export default FormPageHeadersComponent