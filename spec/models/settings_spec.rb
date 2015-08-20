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

describe Settings, probedock: { tags: :unit } do

  let(:sample_settings){
    {
      user_registration_enabled: true
    }
  }

  context ".app" do
    it "should return the app settings", probedock: { key: 'd5fe308a81f7' } do
      Settings::App.first.update_attributes sample_settings
      expect(Settings.app).to eq(OpenStruct.new(sample_settings))
    end
  end
end
