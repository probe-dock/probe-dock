# Copyright (c) 2015 ProbeDock
# Copyright (c) 2012-2014 Lotaris SA
#
# This file is part of ProbeDock.
#
# ProbeDock is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# ProbeDock is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with ProbeDock.  If not, see <http://www.gnu.org/licenses/>.
require 'spec_helper'

RSpec.describe 'Payload processing' do
  include PayloadProcessingSpecHelper

  let(:organization){ create :organization }
  let!(:projects){ Array.new(2){ create :project, organization: organization } }
  let!(:user){ create :org_member, organization: organization }

  it "should process a simple payload", probedock: { key: 'rbzu' } do

    # prepare payload
    raw_payload = generate_raw_payload projects[0], results: [
      { n: 'It should work' },
      { n: 'It might work', p: false },
      { n: 'It should also work' }
    ]

    store_preaction_state

    # publish payload
    with_resque do
      api_post '/api/publish', raw_payload.to_json, user: user
      expect(response.status).to eq(202)
      check_payload_response @response_body, projects[0], user, raw_payload
    end

    # check database changes
    expect_changes test_payloads: 1, test_reports: 1, test_results: 3, project_versions: 1, project_tests: 3, test_descriptions: 3

    # check payload & report
    payload = check_payload @response_body, raw_payload, testsCount: 3, newTestsCount: 3
    check_report payload, organization: organization

    # check project & version
    expect(projects[0].tap(&:reload).tests_count).to eq(3)
    expect_project_version name: raw_payload[:version], projectId: projects[0].api_id

    # check the 3 new tests
    tests = check_tests projects[0], user, payload do
      raw_payload[:results].each do |result|
        check_test name: result[:n]
      end
    end

    # check the 3 results
    check_results raw_payload, payload do
      raw_payload[:results].length.times do |i|
        check_result testId: tests[i].api_id, newTest: true
      end
    end
  end

  it "should combine payloads based on the test report uid", probedock: { key: '9otz' } do

    # prepare 2 payloads
    first_raw_payload = generate_raw_payload projects[0], version: '1.2.3', uid: 'foo', results: [
      { n: 'It should work' }
    ]

    second_raw_payload = generate_raw_payload projects[0], version: '1.2.3', uid: 'foo', results: [
      { n: 'It might work', p: false },
      { n: 'It should also work' }
    ]

    store_preaction_state

    # publish the 2 payloads
    with_resque do
      api_post '/api/publish', first_raw_payload.to_json, user: user
      expect(response.status).to eq(202)
      @first_response_body = @response_body
      check_payload_response @response_body, projects[0], user, first_raw_payload

      api_post '/api/publish', second_raw_payload.to_json, user: user
      expect(response.status).to eq(202)
      check_payload_response @response_body, projects[0], user, second_raw_payload
    end

    # check database changes
    expect_changes test_payloads: 2, test_reports: 1, test_results: 3, project_versions: 1, project_tests: 3, test_descriptions: 3

    # check payloads & report
    first_payload = check_payload @first_response_body, first_raw_payload, testsCount: 1, newTestsCount: 1
    second_payload = check_payload @response_body, second_raw_payload, testsCount: 2, newTestsCount: 2
    check_report first_payload, second_payload, uid: 'foo', organization: organization

    # check project & version
    expect(projects[0].tap(&:reload).tests_count).to eq(3)
    expect_project_version name: '1.2.3', projectId: projects[0].api_id

    # check the 3 new tests
    tests = check_tests projects[0], user, first_payload do
      first_raw_payload[:results].each do |result|
        check_test name: result[:n]
      end
    end

    tests += check_tests(projects[0], user, second_payload) do
      second_raw_payload[:results].each do |result|
        check_test name: result[:n]
      end
    end

    # check the result of the first payload
    check_results first_raw_payload, first_payload do
      check_result test: tests[0], newTest: true
    end

    # check the 2 results of the second payload
    check_results second_raw_payload, second_payload do
      check_result test: tests[1], newTest: true
      check_result test: tests[2], newTest: true
    end
  end

  it "should combine test results by key or name", probedock: { key: 'la9t' } do

    # prepare payload with 12 results
    raw_payload = generate_raw_payload projects[0], results: [
      { n: 'It should work' },                       # 0.  key: bcde (same name as result at index 8)
      { n: 'It might work', p: false },              # 1.  name: It might work
      { n: 'It should also work', k: 'abcd' },       # 2.  key: abcd
      { n: 'It will work', k: 'cdef', p: false },    # 3.  key: cdef
      { n: 'It should work' },                       # 4.  key: bcde (same name as result at index 8)
      { n: 'It would work', p: false },              # 5.  name: It would work
      { n: 'It should also work', k: 'abcd' },       # 6.  key: abcd
      { n: 'It could work', k: 'bcde', p: false },   # 7.  key: bcde
      { n: 'It should work', k: 'bcde' },            # 8.  key: bcde
      { n: 'It will definitely work', k: 'cdef' },   # 9.  key: cdef
      { n: 'It would work', p: false },              # 10. name: It would work
      { n: 'It could work' }                         # 11. key: bcde (same name as result at index 7)
    ]

    store_preaction_state

    # publish payload
    with_resque do
      api_post '/api/publish', raw_payload.to_json, user: user
      expect(response.status).to eq(202)
      check_payload_response @response_body, projects[0], user, raw_payload
    end

    # check database changes
    expect_changes test_payloads: 1, test_reports: 1, project_versions: 1, test_keys: 3, test_results: 12, project_tests: 5, test_descriptions: 5

    # check payload & report
    payload = check_payload @response_body, raw_payload, testsCount: 5, newTestsCount: 5
    check_report payload, organization: organization

    # check project & version
    expect(projects[0].tap(&:reload).tests_count).to eq(5)
    expect_project_version name: raw_payload[:version], projectId: projects[0].api_id

    # check the 5 new tests
    tests = check_tests projects[0], user, payload do
      check_test name: 'It might work'
      check_test name: 'It would work', resultsCount: 2
      check_test name: 'It should also work', key: 'abcd', resultsCount: 2
      check_test name: 'It will definitely work', key: 'cdef', resultsCount: 2
      check_test name: 'It could work', key: 'bcde', resultsCount: 5
    end

    # this array of 12 tests indicates which test each of the 12 results is expected to be attached to
    expected_tests = [ 4, 0, 2, 3, 4, 1, 2, 4, 4, 3, 1, 4 ].collect{ |i| tests[i] }

    # check the 12 results
    check_results raw_payload, payload do
      raw_payload[:results].length.times do |i|
        check_result test: expected_tests[i], newTest: true
      end
    end
  end
end