import { useNavigate } from 'react-router'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import Table from '@webapp/components/Table'

import HeaderLeft from './HeaderLeft'
import Row from './Row'
import RowHeader from './RowHeader'

const ChainsView = () => {
  const navigate = useNavigate()

  const onRowOpen = (nodeDef) => navigate(`${appModuleUri(analysisModules.nodeDef)}${nodeDef.uuid}`)

  return (
    <Table
      className="entities"
      gridTemplateColumns="30px repeat(3, 1fr) 50px"
      headerLeftComponent={HeaderLeft}
      module="virtual-entities"
      onRowOpen={onRowOpen}
      restParams={{}}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
      rowProps={{ onRowOpen }}
    />
  )
}

export default ChainsView
