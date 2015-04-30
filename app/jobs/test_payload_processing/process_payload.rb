# Copyright (c) 2015 42 inside
# Copyright (c) 2012-2014 Lotaris SA
#
# This file is part of Probe Dock.
#
# Probe Dock is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Probe Dock is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Probe Dock.  If not, see <http://www.gnu.org/licenses/>.
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

          @cache = Cache.new project_version.project
          @test_payload.duration = 0

          offset = 0

          loop do
            results = TestPayload.select('id, state, element').from("test_payloads, json_array_elements(test_payloads.contents->'r') element").where(id: test_payload.id).limit(100).offset(offset).to_a.collect(&:element)

            @test_payload.duration += results.inject(0){ |memo,r| memo + r['d'] }
            @test_payload.results_count += results.length
            @test_payload.passed_results_count += results.count{ |r| r.fetch 'p', true }
            @test_payload.inactive_results_count += results.count{ |r| !r.fetch('v', true) }
            @test_payload.inactive_passed_results_count += results.count{ |r| r.fetch('p', true) && !r.fetch('v', true) }

            @cache.prefill results

            results.each do |result|
              test_result = ProcessResult.new(result, @test_payload, @cache).test_result
              ProcessTest.new test_result, @cache
            end

            break if results.blank?
            offset += 100
          end

          @test_payload.duration = duration if duration.present?

          @test_payload.finish_processing!

          # Mark test keys as used.
          free_keys = @cache.test_keys.values.select &:free?
          TestKey.where(id: free_keys.collect(&:id)).update_all free: false if free_keys.any?

          ProcessReports.new @test_payload
        end
      end

      duration = (time * 1000).round 1

      Rails.logger.info "Saved #{@test_payload.results_count} test payload results in #{duration}ms"
    end
  end
end
