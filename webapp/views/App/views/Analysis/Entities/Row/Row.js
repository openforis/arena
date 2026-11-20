import PropTypes from 'prop-types'

import { useNodeDefByUuid, useSurveyPreferredLang } from '@webapp/store/survey'

import { ButtonIconEdit } from '@webapp/components'

const Row = (props) => {
  const { item: entity, onRowOpen } = props
  const parentDef = useNodeDefByUuid(entity?.parentUuid)
  const lang = useSurveyPreferredLang()

  return (
    <>
      <div />
      <div>{entity?.props?.name}</div>
      <div>{entity?.props?.labels?.[lang]}</div>
      <div>{parentDef?.props?.name}</div>
      <div>
        <ButtonIconEdit onClick={() => onRowOpen(entity)} />
      </div>
    </>
  )
}

Row.propTypes = {
  item: PropTypes.object.isRequired,
  onRowOpen: PropTypes.func.isRequired,
}

export default Row
