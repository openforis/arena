import { ButtonDownload } from '@webapp/components'

type Props = {
  totalCount?: number
}

// nothing to export without access requests
export const TableHeaderLeft = ({ totalCount = 0 }: Props) =>
  totalCount > 0 ? <ButtonDownload label="common.exportAll" href="/api/users/users-access-request/export" /> : null
