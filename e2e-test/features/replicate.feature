Feature: User Story republication: replicate GIPOD data set
  see https://vlaamseoverheid.atlassian.net/wiki/spaces/VSDSPUB/pages/6097305677/User+Story+republication+replicate+GIPOD+data+set

Scenario: The complete GIPOD data set is retrieved and made available using the LDES client Nifi wrapper towards a sink.
  Given the GIPOD data set is available at '/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z'
  When the LDES client retrieves the complete data set
  Then all the LDES member are received
