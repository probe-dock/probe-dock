// Copyright (c) 2012-2014 Lotaris SA
//
// This file is part of ROX Center.
//
// ROX Center is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// ROX Center is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with ROX Center.  If not, see <http://www.gnu.org/licenses/>.
var Clipboard = {

  setup: function(el, text) {
    
    el.attr('data-clipboard-text', text);

    var clip = new ZeroClipboard(el);
    clip.on('load', _.bind(this.setupTooltip, this, el, clip));

    return el;
  },

  setupTooltip: function(el, clip, client) {

    el.tooltip(this.tooltipOptions());

    clip.on('mouseover', _.bind(el.tooltip, el, 'show'));
    clip.on('mouseout', _.bind(this.hideTooltip, this, el));

    client.on('complete', _.bind(this.setupCopiedTooltip, this, el));
  },

  setupCopiedTooltip: function(el) {
    el.data('copied', true);
    el.tooltip('destroy');
    el.tooltip(this.tooltipOptions({ title: I18n.t('jst.testInfo.copiedToClipboard') }));
    el.tooltip('show');
  },

  hideTooltip: function(el) {
    el.tooltip('hide');
    if (el.data('copied')) {
      el.tooltip('destroy');
      el.tooltip(this.tooltipOptions());
    }
  },

  tooltipOptions: function(options) {
    return _.defaults({}, options, { title: I18n.t('jst.testInfo.copyToClipboard'), trigger: 'manual' });
  }
};