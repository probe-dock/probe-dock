# Copyright (c) 2015 ProbeDock
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
class Tag < ActiveRecord::Base
  include QuickValidation
  NAME_REGEXP = /\A[a-z0-9\-\_]+\Z/i

  belongs_to :organization
  has_and_belongs_to_many :test_descriptions
  has_and_belongs_to_many :test_results

  strip_attributes
  validates :name, presence: true, uniqueness: { scope: :organization_id, unless: :quick_validation }, length: { maximum: 50 }, format: { with: NAME_REGEXP }
  validates :organization, presence: { unless: :quick_validation }
end
