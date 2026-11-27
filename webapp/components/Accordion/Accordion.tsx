import React from 'react'
import MuiAccordion from '@mui/material/Accordion'
import MuiAccordionDetails from '@mui/material/AccordionDetails'
import MuiAccordionSummary from '@mui/material/AccordionSummary'
import MuiTypography from '@mui/material/Typography'

import { AppIcon } from '@webapp/components/AppIcon'

type AccordionItem = {
  key: string
  defaultExpanded?: boolean
  title: React.ReactNode
  content: React.ReactNode
}

type AccordionProps = {
  className?: string
  items: Array<AccordionItem>
}

export const Accordion = (props: AccordionProps) => {
  const { className, items } = props

  return (
    <div className={`accordion ${className}`}>
      {items.map((item) => (
        <MuiAccordion key={item.key} defaultExpanded={item.defaultExpanded}>
          <MuiAccordionSummary
            expandIcon={<AppIcon name="dropDown" size={20} />}
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
