import React, { useEffect, useRef, useContext, useState } from 'react'
import * as d3 from 'd3'
import { timeDay } from 'd3-time'
import { timeFormat } from 'd3-time-format'
import { RecordsSummaryContext } from '../RecordsSummaryContext'
import './DailyRecordsByUser.css'
import Select from 'react-select'

const DailyRecordsByUser = () => {
  const ref = useRef()
  const { userDateCounts, userCounts } = useContext(RecordsSummaryContext)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [filteredUserDateCounts, setFilteredUserDateCounts] = useState([])

  // Sort userCounts in descending order based on count
  const sortedUserCounts = [...userCounts].sort((a, b) => b.count - a.count)

  function calculateDateData(userDateCounts) {
    let firstDate, lastDate, daysDiff
    if (userDateCounts && userDateCounts.length > 0) {
      firstDate = new Date(userDateCounts[0].date)
      lastDate = new Date(userDateCounts[userDateCounts.length - 1].date)
      daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1
    } else {
      lastDate = new Date()
      firstDate = new Date()
      firstDate.setDate(lastDate.getDate() - 14)
      daysDiff = 15
    }
    return { firstDate, lastDate, daysDiff }
  }

  function groupDataByUserAndDate(userDateCounts, daysDiff, lastDate) {
    return userDateCounts
      ? userDateCounts.reduce((acc, curr) => {
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
      : {}
  }

  function fillMissingDates(groupedData, daysDiff) {
    Object.keys(groupedData).forEach((user) => {
      for (let i = 0; i < daysDiff; i++) {
        if (groupedData[user][i] === undefined) {
          groupedData[user][i] = 0
        }
      }
    })
    return groupedData
  }

  useEffect(() => {
    if (selectedUsers.length > 0) {
      // Filter userDateCounts to only include entries for the selected users
      const filtered = userDateCounts.filter((entry) =>
        selectedUsers.some((user) => user.owner_uuid === entry.owner_uuid)
      )
      setFilteredUserDateCounts(filtered)
    }
  }, [selectedUsers, userDateCounts])

  useEffect(() => {
    if (filteredUserDateCounts.length > 0) {
      const { firstDate, lastDate, daysDiff } = calculateDateData(filteredUserDateCounts)
      let groupedData = groupDataByUserAndDate(filteredUserDateCounts, daysDiff, lastDate)
      groupedData = fillMissingDates(groupedData, daysDiff)

      const data = Object.keys(groupedData).map((user) => ({
        user,
        records: groupedData[user],
      }))

      const margin = { top: 20, right: 120, bottom: 70, left: 30 }
      const width = window.innerWidth * 0.725 - margin.left - margin.right
      const height = 250 - margin.top - margin.bottom

      const x = d3.scaleTime().range([0, width])
      const y = d3.scaleLinear().range([height, 0])

      const color = d3.scaleOrdinal(d3.schemeCategory10)

      const area = d3
        .area()
        .x((d, i) => x(timeDay.offset(lastDate, -i)))
        .y0(height)
        .y1((d) => y(d))

      // Select the SVG if it exists, otherwise create a new one
      let svg = d3.select(ref.current).select('svg')
      if (svg.empty()) {
        svg = d3
          .select(ref.current)
          .append('svg')
          .attr('width', width + margin.left + margin.right + window.innerWidth * 0.15)
          .attr('height', height + margin.top + margin.bottom)
      }
      // Clear the SVG
      svg.selectAll('*').remove()

      svg = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      color.domain(data.map((d) => d.user))

      // Set the domain for the x-axis to be 5 days before the first date and 5 days after the last date
      const currentDate = new Date()
      const fiveDaysAfterLastDate = timeDay.offset(lastDate, 5)
      const upperLimitDate = fiveDaysAfterLastDate > currentDate ? currentDate : fiveDaysAfterLastDate

      x.domain([timeDay.offset(firstDate, -5), upperLimitDate])
      y.domain([0, d3.max(data, (d) => d3.max(d.records))])

      const user = svg.selectAll('.user').data(data).enter().append('g').attr('class', 'user')

      user
        .append('path')
        .attr('class', 'area')
        .attr('d', (d) => area(d.records))
        .style('fill', (d) => color(d.user))
        .style('opacity', 0.2)
        .style('stroke', (d) => color(d.user))
        .style('stroke-opacity', 0.8) // Adjusted stroke opacity

      // Add line to chart
      const line = d3
        .line()
        .x((d, i) => x(timeDay.offset(lastDate, -i)))
        .y((d) => y(d))

      user
        .append('path')
        .attr('class', 'line')
        .attr('d', (d) => line(d.records))
        .style('stroke', (d) => color(d.user))
        .style('stroke-width', 0.75)
        .style('fill', 'none')

      // Add tooltip
      const tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0)
      tooltip.style('background-color', 'white')
      tooltip.style('padding', '5px')
      tooltip.style('border-radius', '5px')
      tooltip.style('position', 'absolute')
      tooltip.style('z-index', '10')
      tooltip.style('color', 'black')

      user
        .selectAll('dot')
        .data((d) => d.records.map((record) => ({ record, user: d.user })))
        .enter()
        .append('circle')
        .attr('r', 3)
        .attr('cx', (d, i) => x(timeDay.offset(lastDate, -i)))
        .attr('cy', (d) => y(d.record))
        .style('fill', (d) => color(d.user))
        .on('mouseover', function (event, d) {
          d3.select(this).transition().duration(100).attr('r', 6)
          tooltip.transition().duration(100).style('opacity', 0.9)
          tooltip
            .html('Records: ' + d.record + '<br/>' + 'User: ' + d.user)
            .style('left', event.pageX + 'px')
            .style('top', event.pageY - 28 + 'px')
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

      const legend = svg.selectAll('.legend').data(data).enter().append('g').attr('class', 'legend')

      legend
        .append('rect')
        .attr('x', width) // Adjust the x attribute to start where the chart ends
        .attr('y', (d, i) => i * 20)
        .attr('width', 12)
        .attr('height', 12)
        .style('fill', (d) => color(d.user))

      legend
        .append('text')
        .attr('x', width + 15) // Adjust the x attribute to place the text to the right of the color rectangle
        .attr('y', (d, i) => i * 20 + 9)
        .attr('dy', '.15em')
        .style('text-anchor', 'start') // Adjust the text-anchor attribute to start
        .text((d) => d.user) // Remove the code that truncates the user name

      svg
        .append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x).ticks(d3.timeDay.every(1)).tickFormat(timeFormat('%Y-%m-%d')))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '12px')

      svg
        .append('g')
        .call(d3.axisLeft(y).tickFormat((d) => Math.floor(d)))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'start')
        .text('Records added')

      svg
        .append('text')
        .attr('transform', 'translate(' + width / 2 + ' ,' + (height + margin.bottom) + ')')
        .style('text-anchor', 'middle')
        .text('Date')
    }
  }, [filteredUserDateCounts])

  return (
    <div className="container">
      <h4 className="center-text">Daily records added by user</h4>
      <Select
        isMulti
        options={sortedUserCounts.map((user) => ({
          value: user.owner_uuid,
          label: user.owner_name || user.owner_email,
        }))}
        onChange={(selectedOptions) =>
          setSelectedUsers(
            selectedOptions
              ? selectedOptions.map((option) => sortedUserCounts.find((user) => user.owner_uuid === option.value))
              : []
          )
        }
        styles={{ menu: (provided) => ({ ...provided, width: '300px' }) }}
      />
      <div ref={ref} className="chart-container"></div>
    </div>
  )
}

export default DailyRecordsByUser
