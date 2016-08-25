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
require 'benchmark'

module TestPayloadProcessing
  class ProcessPayload
    attr_reader :test_payload

    def initialize test_payload

      raise "Test payload must be in :processing state" unless test_payload.processing?

      @test_payload = test_payload
      Rails.logger.info "Starting to process payload received at #{@test_payload.received_at}"

      time = Benchmark.realtime do

        TestPayload.transaction do

          project_api_id = @test_payload.raw_project
          project_version_name = @test_payload.raw_project_version
          duration = @test_payload.raw_duration

          project_version = ProjectVersion.joins(:project).where('projects.api_id = ? AND project_versions.name = ?', project_api_id, project_version_name).includes(:project).first
          project_version ||= ProjectVersion.new(project_id: Project.where(api_id: project_api_id).first!.id, name: project_version_name).tap(&:save_quickly!)
          @test_payload.project_version = project_version

          organization = project_version.project.organization

          @cache = PayloadCache.new project_version
          @test_payload.duration = 0

          offset = 0

          loop do
            results = TestPayload.select('id, state, element').from("test_payloads, json_array_elements(test_payloads.contents->'results') element").where(id: test_payload.id).limit(100).offset(offset).to_a.collect(&:element)

            @test_payload.duration += results.inject(0){ |memo,r| memo + r['d'] }
            @test_payload.results_count += results.length
            @test_payload.passed_results_count += results.count{ |r| r.fetch 'p', true }
            @test_payload.inactive_results_count += results.count{ |r| !r.fetch('v', true) }
            @test_payload.inactive_passed_results_count += results.count{ |r| r.fetch('p', true) && !r.fetch('v', true) }

            @cache.prefill results

            results.each do |result|
              ProcessResult.new result, @test_payload, @cache
            end

            break if results.blank?
            offset += 100
          end

          @test_payload.tests_count = @cache.test_data.length
          @test_payload.new_tests_count = @cache.test_data.select{ |d| !d[:test] }.length

          # create or update each individual test identified from the test results
          assigned_results = []
          @cache.test_data.each do |data|
            results = matching_results @cache.test_results, data, assigned_results
            ProcessTest.new project_version, data[:key], data[:test], results
            assigned_results += results
          end

          # update the number of tests in the project
          Project.update_counters project_version.project.id, tests_count: @test_payload.new_tests_count

          @test_payload.duration = duration if duration.present?

          @test_payload.categories = @cache.categories.values

          @test_payload.finish_processing!

          if $redis.sismember "elastic:organizations", organization.api_id
            import_all_test_results_into_elasticsearch
          end

          # Mark test keys as used.
          free_keys = @cache.test_keys.values.select &:free?
          TestKey.where(id: free_keys.collect(&:id)).update_all free: false if free_keys.any?

          ProcessReports.new @test_payload
        end
      end

      duration = (time * 1000).round 1

      Rails.logger.info "Saved #{@test_payload.results_count} test payload results in #{duration}ms"
    end

    private

    # Returns the results associated with the specified test.
    def matching_results test_results, test_data, assigned_results
      test_results.select do |r|
        # all results with the same key or with no key but the same name
        (r.key && r.key == test_data[:key]) || (!r.key && test_data[:names].include?(r.name))
      end.reject do |r|
        # except those that have already been used
        assigned_results.include? r
      end
    end

    def import_all_test_results_into_elasticsearch

      bulk = []
      TestResult.where(id: @cache.test_results.collect(&:id)).includes([ :category, :runner, :tags, :tickets, :test, { key: :user, project_version: { project: :organization } }, test_payload: :test_reports ]).find_each do |result|
        bulk << {
          index: {
            _index: ElasticTestResult.index_name.to_s,
            _type: ElasticTestResult.name,
            _id: result.id,
            data: ElasticTestResult.from_test_result(result).as_json
          }
        }
      end

      ElasticTestResult.gateway.client.bulk body: bulk
    rescue StandardError => e
      Rails.logger.warn("Could not import test results into elasticsearch: #{e.message}")
    end

    def import_test_result_into_elasticsearch result
      ElasticTestResult.from_test_result(result).save
    end
  end
end
