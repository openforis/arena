import './Accordion.scss'

import React from 'react'
import PropTypes from 'prop-types'
import MuiAccordion from '@mui/material/Accordion'
import MuiAccordionSummary from '@mui/material/AccordionSummary'
import MuiAccordionDetails from '@mui/material/AccordionDetails'
import MuiTypography from '@mui/material/Typography'

export const Accordion = (props) => {
  const { items } = props

  return (
    <div className="accordion">
      {items.map((item) => (
        <MuiAccordion key={item.key} defaultExpanded={item.defaultExpanded}>
          <MuiAccordionSummary
            expandIcon={<span className="icon icon-ctrl icon-20px expand-icon" />}
            aria-controls={`panel${item.key}-content`}
            id={`panel${item.key}-header`}
          >
            <MuiTypography component="span">{item.title}</MuiTypography>
          </MuiAccordionSummary>
          <MuiAccordionDetails>{item.content}</MuiAccordionDetails>
        </MuiAccordion>
      ))}
    </div>
  )
}

Accordion.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      defaultExpanded: PropTypes.bool,
      title: PropTypes.node.isRequired,
      content: PropTypes.node.isRequired,
    })
  ).isRequired,
}
