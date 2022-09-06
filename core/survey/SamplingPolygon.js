import * as Survey from '@core/survey/survey'

export const getLengthLatitude = (surveyInfo) => {
    return Survey.getSamplingPolygon(surveyInfo).lengthLatitude || 0
}

export const getLengthLongitude = (surveyInfo) => {
    return Survey.getSamplingPolygon(surveyInfo).lengthLongitude || 0
}

export const getOffsetNorth = (surveyInfo) => {
    return Survey.getSamplingPolygon(surveyInfo).offsetNorth || 0
}

export const getOffsetEast = (surveyInfo) => {
    return Survey.getSamplingPolygon(surveyInfo).offsetEast || 0
}

export const getNumberOfPointsNorth = (surveyInfo) => {
    return Survey.getSamplingPolygon(surveyInfo).numberOfPointsNorth || 0
}

export const getNumberOfPointsEast = (surveyInfo) => {
    return Survey.getSamplingPolygon(surveyInfo).numberOfPointsEast || 0
}

export const getNumberOfPointsCircle = (surveyInfo) => {
    return Survey.getSamplingPolygon(surveyInfo).numberOfPointsCircle || 0
}

export const getControlPointOffsetNorth = (surveyInfo) => {
    return Survey.getSamplingPolygon(surveyInfo).controlPointOffsetNorth || 0
}

export const getControlPointOffsetEast = (surveyInfo) => {
    return Survey.getSamplingPolygon(surveyInfo).controlPointOffsetEast || 0
}

export const getRadius = (surveyInfo) => {
    return Survey.getSamplingPolygon(surveyInfo).radius || 0
}

export const getIsCircle = (surveyInfo) => {
    return Survey.getSamplingPolygon(surveyInfo).isCircle || false
}

