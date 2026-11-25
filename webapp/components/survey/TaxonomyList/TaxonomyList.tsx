import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import * as Taxonomy from '@core/survey/taxonomy'
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useIsTaxonomiesRoute } from '@webapp/components/hooks'
import Table from '@webapp/components/Table/Table'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import HeaderLeft from './HeaderLeft'
import Row from './Row'
import RowHeader from './RowHeader'

type TaxonomyListProps = {
  canSelect?: boolean
  onSelect?: (...args: any[]) => any
  onTaxonomyOpen?: (...args: any[]) => any
  onTaxonomyCreated?: (...args: any[]) => any
  selectedItemUuid?: string
}

const TaxonomyList = (props: TaxonomyListProps) => {
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

export default TaxonomyList
