import React from 'react'
import PropTypes from 'prop-types'
import MuiAccordion from '@mui/material/Accordion'
import MuiAccordionSummary from '@mui/material/AccordionSummary'
import MuiAccordionDetails from '@mui/material/AccordionDetails'
import MuiTypography from '@mui/material/Typography'

export const Accordion = (props) => {
  const { items } = props

  return (
    <div>
      {items.map((item, index) => (
        <MuiAccordion key={index} defaultExpanded={item.defaultExpanded}>
          <MuiAccordionSummary
            expandIcon={<span className="icon icon-ctrl icon-20px" />}
            aria-controls={`panel${index}-content`}
            id={`panel${index}-header`}
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
      defaultExpanded: PropTypes.bool,
      title: PropTypes.node.isRequired,
      content: PropTypes.node.isRequired,
    })
  ).isRequired,
}
