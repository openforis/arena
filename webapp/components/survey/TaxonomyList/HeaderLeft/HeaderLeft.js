import React from 'react'
import PropTypes from 'prop-types'

import ButtonTaxonomyAdd from '@webapp/components/survey/ButtonTaxonomyAdd'

const HeaderLeft = (props) => {
  const { headerProps } = props
  const { onTaxonomyCreated } = headerProps

  return (
    <div>
      <ButtonTaxonomyAdd onTaxonomyCreated={onTaxonomyCreated} />
    </div>
  )
}

HeaderLeft.propTypes = {
  headerProps: PropTypes.object,
}

HeaderLeft.defaultProps = {
  headerProps: {},
}

export default HeaderLeft
