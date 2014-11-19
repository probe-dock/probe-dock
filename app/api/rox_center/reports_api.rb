# Copyright (c) 2012-2014 Lotaris SA
#
# This file is part of ROX Center.
#
# ROX Center is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# ROX Center is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with ROX Center.  If not, see <http://www.gnu.org/licenses/>.
module ROXCenter
  class ReportsApi < Grape::API

    namespace :reports do

      before do
        authenticate!
      end

      get do

        base = TestReport

        if params[:after]
          ref = TestReport.select('id, created_at').where(api_id: params[:after].to_s).first!
          base = base.where 'created_at > ?', ref.created_at
        end

        TestReport.tableling.process(params.merge(base: base))
      end

      namespace '/:id' do

        helpers do
          def current_report
            TestReport.where(api_id: params[:id].to_s).first!
          end

          def report_health_template
            @report_health_template ||= Slim::Template.new(Rails.root.join('app', 'views', 'reports', 'health.html.slim').to_s)
          end
        end

        get do
          current_report.to_builder(detailed: true).attributes!
        end

        get :health do

          html = ''

          offset = 0
          limit = 100

          begin
            current_results = current_report.results.order('name, id').offset(offset).limit(limit).to_a
            html << report_health_template.render(OpenStruct.new(results: current_results))
            offset += limit
          end while current_results.present?

          {
            html: html
          }
        end

        get :results do

          results = current_report.results
          total = results.count

          limit = params[:pageSize].to_i
          limit = 100 if limit <= 0 || limit > 100

          page = params[:page].to_i
          page = 1 if page < 1
          offset = (page - 1) * limit

          header 'X-Pagination', "page=#{page} pageSize=#{limit} total=#{total}"
          results.order('active desc, passed, name, id').offset(offset).limit(limit).to_a.collect{ |r| r.to_builder.attributes! }
        end
      end
    end
  end
end