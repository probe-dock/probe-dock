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
  class UsersApi < Grape::API

    namespace :users do

      before do
        authenticate!
      end

      helpers do
        def parse_user
          parse_object :name, :email, :active
        end
      end

      get do
        User.tableling.process(params)
      end

      namespace '/:id' do

        helpers do
          def current_user
            User.where(api_id: params[:id].to_s).first!
          end
        end

        get do
          current_user
        end

        patch do
          update_record current_user, parse_user do |user,updates|
            user.name = updates[:name] if updates.key? :name
            user.active = !!updates[:active] if updates.key? :active
            user.email = Email.where(email: updates[:email]).first || Email.new(email: updates[:email]) if updates[:email] != user.email.try(:email) if updates.key? :email
            user.save
          end
        end

        delete do
          current_user.destroy
          status 204
        end
      end
    end
  end
end
