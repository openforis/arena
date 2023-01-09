import * as React from 'react'
import PropTypes from 'prop-types'
import MuiAccordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import { useI18n } from '@webapp/store/system'

const Accordion = (props) => {
  const { children, title: titleKey } = props
  const i18n = useI18n()

  const title = i18n.t(titleKey)

  return (
    <MuiAccordion square>
      <AccordionSummary expandIcon={<span className="icon icon-arrow-down" />}>
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </MuiAccordion>
  )
}

Accordion.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
}

export default Accordion
