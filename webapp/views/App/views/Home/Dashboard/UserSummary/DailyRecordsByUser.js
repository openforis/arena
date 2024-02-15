import React, { useEffect, useRef, useContext, useState } from 'react'
import * as d3 from 'd3'
import { timeDay } from 'd3-time'
import { timeFormat } from 'd3-time-format'

import { useElementOffset } from '@webapp/components/hooks'
import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'

import { RecordsSummaryContext } from '../RecordsSummaryContext'
import RecordsSummaryPeriodSelector from '../RecordsSummary/RecordsSummaryPeriodSelector'

const svgMargin = { top: 10, right: 10, bottom: 10, left: 10 }
const internalAreaMargin = { top: 20, right: 20, bottom: 120, left: 20 }

const calculateDateData = (userDateCounts) => {
  let firstDate, lastDate, daysDiff
  if (userDateCounts && userDateCounts.length > 0) {
    firstDate = new Date(userDateCounts[0].date)
    lastDate = new Date(userDateCounts[userDateCounts.length - 1].date)
    daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1
  } else {
    daysDiff = 15
    lastDate = new Date()
    firstDate = new Date()
    firstDate.setDate(lastDate.getDate() - daysDiff - 1)
  }
  return { firstDate, lastDate, daysDiff }
}

const groupDataByUserAndDate = (userDateCounts, daysDiff, lastDate) => {
  if (!userDateCounts) return {}
  return userDateCounts.reduce((acc, curr) => {
    let user = curr.owner_name ? curr.owner_name : curr.owner_email
    if (!curr.owner_name) {
      user = user.substring(0, user.indexOf('@'))
    }
    if (!acc[user]) {
      acc[user] = Array.from({ length: daysDiff }, () => 0)
    }
    const dateIndex = Math.floor((lastDate - new Date(curr.date)) / (1000 * 60 * 60 * 24))
    if (dateIndex < daysDiff) {
      acc[user][dateIndex] = parseInt(curr.count)
    }
    return acc
  }, {})
}

const fillMissingDates = (groupedData, daysDiff) => {
  Object.keys(groupedData).forEach((user) => {
    for (let i = 0; i < daysDiff; i++) {
      if (groupedData[user][i] === undefined) {
        groupedData[user][i] = 0
      }
    }
  })
  return groupedData
}

const DailyRecordsByUser = () => {
  const i18n = useI18n()
  const wrapperRef = useRef()
  const containerRef = useRef()
  const { userDateCounts, userCounts } = useContext(RecordsSummaryContext)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [filteredUserDateCounts, setFilteredUserDateCounts] = useState([])
  const { height, width } = useElementOffset(wrapperRef)

  // Sort userCounts in descending order based on count
  const sortedUserCounts = [...userCounts].sort((a, b) => b.count - a.count)

  useEffect(() => {
    const filteredUserDataCountsNext =
      selectedUsers.length > 0
        ? // Filter userDateCounts to only include entries for the selected users
          userDateCounts.filter((entry) => selectedUsers.some((user) => user.owner_uuid === entry.owner_uuid))
        : []
    setFilteredUserDateCounts(filteredUserDataCountsNext)
  }, [selectedUsers, userDateCounts])

  useEffect(() => {
    // Select the SVG if it exists, otherwise create a new one
    const d3ContainerSelection = d3.select(containerRef.current)
    let svg = d3ContainerSelection.select('svg')
    // Clear the SVG
    svg.selectAll('*').remove()

    if (!filteredUserDateCounts.length) {
      return
    }

    const svgWidth = width - internalAreaMargin.left - internalAreaMargin.right
    const svgHeight = height - svgMargin.top - svgMargin.bottom

    const areaWidth = svgWidth - internalAreaMargin.left - internalAreaMargin.right
    const areaHeight = height - internalAreaMargin.top - internalAreaMargin.bottom

    const { firstDate, lastDate, daysDiff } = calculateDateData(filteredUserDateCounts)
    let groupedData = groupDataByUserAndDate(filteredUserDateCounts, daysDiff, lastDate)
    groupedData = fillMissingDates(groupedData, daysDiff)
    const data = Object.keys(groupedData).map((user) => ({
      user,
      records: groupedData[user],
    }))
    const xScale = d3.scaleTime().range([0, areaWidth])
    const yScale = d3.scaleLinear().range([areaHeight, 0])
    const color = d3.scaleOrdinal(d3.schemeCategory10)
    const area = d3
      .area()
      .x((d, i) => xScale(timeDay.offset(lastDate, -i)))
      .y0(areaHeight)
      .y1((d) => yScale(d))

    if (svg.empty()) {
      svg = d3ContainerSelection.append('svg')
    }
    svg.attr('width', svgWidth).attr('height', svgHeight)

    // Clear the SVG
    svg.selectAll('*').remove()
    svg = svg.append('g').attr('transform', 'translate(' + internalAreaMargin.left + ',' + internalAreaMargin.top + ')')

    color.domain(data.map((d) => d.user))
    // Set the domain for the x-axis to be 5 days before the first date and 5 days after the last date
    const currentDate = new Date()
    const fiveDaysAfterLastDate = timeDay.offset(lastDate, 5)
    const upperLimitDate = fiveDaysAfterLastDate > currentDate ? currentDate : fiveDaysAfterLastDate
    xScale.domain([timeDay.offset(firstDate, -5), upperLimitDate])
    yScale.domain([0, d3.max(data, (d) => d3.max(d.records))])

    const user = svg.selectAll('.user').data(data).enter().append('g').attr('class', 'user')
    user
      .append('path')
      .attr('class', 'area')
      .attr('d', (d) => area(d.records))
      .style('fill', (d) => color(d.user))
      .style('opacity', 0.2)
      .style('stroke', (d) => color(d.user))
      .style('stroke-opacity', 0.8) // Adjusted stroke opacity

    // Add lines to chart
    const line = d3
      .line()
      .x((d, i) => xScale(timeDay.offset(lastDate, -i)))
      .y((d) => yScale(d))
    user
      .append('path')
      .attr('class', 'line')
      .attr('d', (d) => line(d.records))
      .style('stroke', (d) => color(d.user))
      .style('stroke-width', 0.75)
      .style('fill', 'none')

    // Add tooltip
    let tooltip = d3ContainerSelection.select('.tooltip')
    if (tooltip.empty()) {
      tooltip = d3ContainerSelection
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('background-color', 'white')
        .style('padding', '5px')
        .style('border-radius', '5px')
        .style('position', 'absolute')
        .style('z-index', '10')
        .style('color', 'black')
    }

    // user data dots
    user
      .selectAll('dot')
      .data((d) => d.records.map((record) => ({ record, user: d.user })))
      .enter()
      .append('circle')
      .attr('r', 3)
      .attr('cx', (d, i) => xScale(timeDay.offset(lastDate, -i)))
      .attr('cy', (d) => yScale(d.record))
      .style('fill', (d) => color(d.user))
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(100).attr('r', 6)
        tooltip.transition().duration(100).style('opacity', 0.9)
        tooltip
          .html('Records: ' + d.record + '<br/>' + 'User: ' + d.user)
          .style('left', event.layerX + 20 + 'px')
          .style('top', event.layerY - 28 + 'px')
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(20).attr('r', 3)
        tooltip
          .transition()
          .duration(200)
          .style('opacity', 0)
          .on('end', function () {
            tooltip.html('')
          })
      })

    // legend
    const legend = svg.selectAll('.legend').data(data).enter().append('g').attr('class', 'legend')
    legend
      .append('rect')
      .attr('x', svgWidth - 150) // Adjust the x attribute to start where the chart ends
      .attr('y', (d, i) => i * 20)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', (d) => color(d.user))
    legend
      .append('text')
      .attr('x', svgWidth - 130) // Adjust the x attribute to place the text to the right of the color rectangle
      .attr('y', (d, i) => i * 20 + 9)
      .attr('dy', '.15em')
      .style('text-anchor', 'start') // Adjust the text-anchor attribute to start
      .text((d) => d.user) // Remove the code that truncates the user name

    // X axis
    svg
      .append('g')
      .attr('transform', 'translate(0,' + areaHeight + internalAreaMargin.top + ')')
      .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(1)).tickFormat(timeFormat('%Y-%m-%d')))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '12px')

    // Y axis label
    svg
      .append('g')
      .call(d3.axisLeft(yScale).tickFormat((d) => Math.floor(d)))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'start')
      .text('Records added')

    // X axis label
    svg
      .append('text')
      .attr('transform', 'translate(' + svgWidth / 2 + ' ,' + (height - 50) + ')')
      .style('text-anchor', 'middle')
      .text('Date')
  }, [filteredUserDateCounts, height, width])

  return (
    <>
      <h4 className="chart-header">{i18n.t('homeView.dashboard.dailyRecordsByUser')}</h4>

      <RecordsSummaryPeriodSelector />

      <Dropdown
        multiple
        items={sortedUserCounts}
        itemLabel={(user) => user.owner_name ?? user.owner_email}
        itemValue={(user) => user.owner_uuid}
        onChange={(selectedOptions) => setSelectedUsers(selectedOptions)}
        placeholder={i18n.t('homeView.dashboard.selectUsers')}
      />
      <div className="chart-wrapper" ref={wrapperRef}>
        <div ref={containerRef} className="chart-container"></div>
      </div>
    </>
  )
}

export default DailyRecordsByUser
