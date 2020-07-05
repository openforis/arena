# Survey creation
Tags: survey

The user must be able to create new surveys, edit and delete old ones

## Successful survey creation (1)
Tags: survey, success

With correct data, user is able to create a survey.

* Wait for ".home-dashboard" to exist
* Navigate to "Create Survey"
* Create a new survey with "survey_1" and "Survey 1"
* Wait for load complete
* Page contains "Survey 1"

## Successful survey creation (2)
Tags: survey, success

With correct data, user is able to create a survey.
Another survey has been inserted previously.

* Navigate to "Create Survey"
* Create a new survey with "survey_2" and "Survey 2"
* Wait for load complete
* Page contains "Survey 2"

## Successful survey selection
Tags: survey, success

When user selects a survey, the home dashboard changes its content.

* Navigate to "My Surveys"
* Page contains "Survey 1"
* Page contains "Survey 2"
* Click on "Survey 1"
* Wait for ".home-dashboard" to exist
* Page contains "Survey 1"
