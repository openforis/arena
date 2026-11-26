import Add from '@mui/icons-material/Add'
import ArrowBack from '@mui/icons-material/ArrowBack'
import ArrowForward from '@mui/icons-material/ArrowForward'
import Close from '@mui/icons-material/Close'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined'
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined'
import FormatListBulleted from '@mui/icons-material/FormatListBulleted'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined'
import LockOutlined from '@mui/icons-material/LockOutlined'
import MailOutlined from '@mui/icons-material/MailOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import SaveOutlined from '@mui/icons-material/SaveOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'

/**
 * Material icons used by the app, by semantic name.
 * Imported one by one so that only the icons listed here end up in the bundle.
 */
export const iconComponents = {
  add: Add,
  arrowBack: ArrowBack,
  arrowForward: ArrowForward,
  close: Close,
  delete: DeleteOutlined,
  download: FileDownloadOutlined,
  // chevron: MUI / Material convention for buttons opening a menu
  dropDown: KeyboardArrowDown,
  edit: EditOutlined,
  filter: FilterAltOutlined,
  info: InfoOutlined,
  list: FormatListBulleted,
  lock: LockOutlined,
  lockOpen: LockOpenOutlined,
  mail: MailOutlined,
  map: MapOutlined,
  save: SaveOutlined,
  settings: SettingsOutlined,
  view: VisibilityOutlined,
}

export type IconName = keyof typeof iconComponents
