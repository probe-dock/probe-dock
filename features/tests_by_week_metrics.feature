@api @metrics
Feature: Reports by day metrics

  Users should be able to retrieve the number of new tests by day of an organization.
  The users can filter the by project and/or by user.
  Finally, the users can retrieve between 1 and 120 days of data.

  The following result is provided:
  - testsCount for each day
  - date for each day


  Background:
    Given private organization Rebel Alliance exists
    And user hsolo who is a member of Rebel Alliance exists
    And user lskywalker who is a member of Rebel Alliance exists
    And project X-Wing exists within organization Rebel Alliance
    And test "Ion engine should provide thrust" was created by lskywalker with key k1 for version 1.0.0 of project X-Wing
    And test "Shields must protect" was created 1 week ago by lskywalker with key k2 for version 1.0.0 of project X-Wing
    And test "Proton torpedo should not explode on load" was created 2 weeks ago by lskywalker with key k3 for version 1.0.0 of project X-Wing
    And test "Fuel must be efficient" was created 3 weeks ago by lskywalker with key k4 for version 1.0.0 of project X-Wing
    And test "Wings should be opened" was created 4 weeks ago by hsolo with key k5 for version 1.0.0 of project X-Wing
    And project Y-Wing exists within organization Rebel Alliance
    And test "Wings must be enough for atmospheric flights" was created by hsolo with key k6 for version 1.0.0 of project Y-Wing
    And assuming tests by week metrics are calculated for 3 weeks by default



  Scenario: An organization member should be able to get the organization's reports by day metrics
    When hsolo sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}
    Then the response code should be 200
    And the response body should be the following JSON:
      """
      [{
        "date": "@date(2 week ago beginning of week)",
        "testsCount": 3
      }, {
        "date": "@date(1 week ago beginning of week)",
        "testsCount": 4
      }, {
        "date": "@date(beginning of week)",
        "testsCount": 6
      }]
      """
    And nothing should have been added or deleted



  Scenario: An organization member should be able to get the organization's reports by day metrics filtered by project
    When hsolo sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}&projectIds[]={@idOf: X-Wing}
    Then the response code should be 200
    And the response body should be the following JSON:
      """
      [{
        "date": "@date(2 week ago beginning of week)",
        "testsCount": 3
      }, {
        "date": "@date(1 week ago beginning of week)",
        "testsCount": 4
      }, {
        "date": "@date(beginning of week)",
        "testsCount": 5
      }]
      """
    And nothing should have been added or deleted



  Scenario: An organization member should be able to get the organization's reports by day metrics filtered by user
    When hsolo sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}&userIds[]={@idOf: hsolo}
    Then the response code should be 200
    And the response body should be the following JSON:
      """
      [{
        "date": "@date(2 week ago beginning of week)",
        "testsCount": 1
      }, {
        "date": "@date(1 week ago beginning of week)",
        "testsCount": 1
      }, {
        "date": "@date(beginning of week)",
        "testsCount": 2
      }]
      """
    And nothing should have been added or deleted



  Scenario: An organization member should be able to get the organization's reports by day metrics filtered by project and user
    When hsolo sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}&projectIds[]={@idOf: X-Wing}&userIds[]={@idOf: hsolo}
    Then the response code should be 200
    And the response body should be the following JSON:
      """
      [{
        "date": "@date(2 week ago beginning of week)",
        "testsCount": 1
      }, {
        "date": "@date(1 week ago beginning of week)",
        "testsCount": 1
      }, {
        "date": "@date(beginning of week)",
        "testsCount": 1
      }]
      """
    And nothing should have been added or deleted



  @authorization
  Scenario: An organization member should not be able to get the reports from another organization
    Given private organization Galactic Republic exists
    And user palpatine who is an admin of Galactic Republic exists
    When palpatine sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}
    Then the response should be HTTP 403 with the following errors:
      | message                                        |
      | You are not authorized to perform this action. |
    And nothing should have been added or deleted



  @authorization
  Scenario: An organization member should not be able to get the reports from another organization filtered by projects
    Given private organization Galactic Republic exists
    And user palpatine who is an admin of Galactic Republic exists
    When palpatine sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}&projectIds[]={@idOf: X-Wing}
    Then the response should be HTTP 403 with the following errors:
      | message                                        |
      | You are not authorized to perform this action. |
    And nothing should have been added or deleted



  @authorization
  Scenario: An organization member should not be able to get the reports from another organization filtered by users
    Given private organization Galactic Republic exists
    And user palpatine who is an admin of Galactic Republic exists
    When palpatine sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}&userIds[]={@idOf: lskywalker}
    Then the response should be HTTP 403 with the following errors:
      | message                                        |
      | You are not authorized to perform this action. |
    And nothing should have been added or deleted



  @authorization
  Scenario: An organization member should not be able to get the reports from another organization filtered by projects and users
    Given private organization Galactic Republic exists
    And user palpatine who is an admin of Galactic Republic exists
    When palpatine sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}&projectIds[]={@idOf: X-Wing}&userIds[]={@idOf: lskywalker}
    Then the response should be HTTP 403 with the following errors:
      | message                                        |
      | You are not authorized to perform this action. |
    And nothing should have been added or deleted



  @authorization
  Scenario: An anonymous user should not be able to get the reports from private organization
    When nobody sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}
    Then the response should be HTTP 403 with the following errors:
      | message                                        |
      | You are not authorized to perform this action. |
    And nothing should have been added or deleted



  @authorization
  Scenario: An anonymous user should not be able to get the reports from private organization filtered by projects
    When nobody sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}&projectIds[]={@idOf: X-Wing}
    Then the response should be HTTP 403 with the following errors:
      | message                                        |
      | You are not authorized to perform this action. |
    And nothing should have been added or deleted



  @authorization
  Scenario: An anonymous user should not be able to get the reports from private organization filtered by users
    When nobody sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}&userIds[]={@idOf: lskywalker}
    Then the response should be HTTP 403 with the following errors:
      | message                                        |
      | You are not authorized to perform this action. |
    And nothing should have been added or deleted



  @authorization
  Scenario: An anonymous user should not be able to get the reports from private organization filtered by projects and users
    When nobody sends a GET request to /api/metrics/testsByWeek?organizationId={@idOf: Rebel Alliance}&projectIds[]={@idOf: X-Wing}&userIds[]={@idOf: lskywalker}
    Then the response should be HTTP 403 with the following errors:
      | message                                        |
      | You are not authorized to perform this action. |
    And nothing should have been added or deleted