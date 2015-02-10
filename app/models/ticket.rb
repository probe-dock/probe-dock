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
class Ticket < ActiveRecord::Base
  include QuickValidation

  has_and_belongs_to_many :test_descriptions
  has_and_belongs_to_many :test_results

  strip_attributes
  validates :name, presence: true, uniqueness: { unless: :quick_validation }, length: { maximum: 255 }

  def url
    return nil unless ticketing_system_url = Settings.app.ticketing_system_url
    ticketing_system_url.sub /\%\{name\}/, name
  end

  def to_client_hash options = {}
    { id: id, name: name }.tap do |h|
      u = url
      h[:url] = u if u.present?
    end
  end
end
