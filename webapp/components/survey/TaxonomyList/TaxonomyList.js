import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import PropTypes from 'prop-types'

import * as Taxonomy from '@core/survey/taxonomy'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useIsTaxonomiesRoute } from '@webapp/components/hooks'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import Table from '@webapp/components/Table/Table'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const TaxonomyList = (props) => {
  const {
    canSelect = false,
    onSelect: onTaxonomySelect = null,
    onTaxonomyOpen = null,
    onTaxonomyCreated = null,
    selectedItemUuid = null,
  } = props

  const canEdit = useAuthCanEditSurvey()
  const navigate = useNavigate()
  const inTaxonomiesPath = useIsTaxonomiesRoute()

  const onRowOpen = useCallback(
    (taxonomy) => {
      if (inTaxonomiesPath) {
        navigate(`${appModuleUri(designerModules.taxonomy)}${Taxonomy.getUuid(taxonomy)}/`)
      } else {
        // e.g. taxonomy selector in the node def editor
        onTaxonomyOpen?.(taxonomy)
      }
    },
    [inTaxonomiesPath, navigate, onTaxonomyOpen]
  )

  let gridTemplateColumns = 'repeat(2, 1fr) 8rem 8rem repeat(2, 6rem)'
  if (canSelect) {
    // select button
    gridTemplateColumns += ' 6rem'
  }
  // view/edit button
  gridTemplateColumns += ' 50px'

  if (canEdit) {
    // delete button
    gridTemplateColumns += ' 2rem'
  }

  return (
    <Table
      module="taxonomies"
      className="taxonomies-list"
      restParams={{ draft: true, validate: true }}
      gridTemplateColumns={gridTemplateColumns}
      headerLeftComponent={HeaderLeft}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
      rowProps={{ canSelect, selectedItemUuid, onTaxonomySelect, onRowOpen }}
      onRowOpen={onRowOpen}
      headerProps={{ onTaxonomyOpen, onTaxonomyCreated }}
    />
  )
}

TaxonomyList.propTypes = {
  canSelect: PropTypes.bool,
  onSelect: PropTypes.func,
  onTaxonomyOpen: PropTypes.func,
  onTaxonomyCreated: PropTypes.func,
  selectedItemUuid: PropTypes.string,
}

export default TaxonomyList
