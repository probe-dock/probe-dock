// Copyright (c) 2012-2013 Lotaris SA
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

App.autoModule('apiKeysTable', function() {

  var models = App.module('models'),
      ApiKey = models.ApiKey,
      ApiKeyCollection = models.ApiKeyCollection;
  
  var views = App.module('views'),
      Table = views.Table;

  var NoApiKeyRow = Backbone.Marionette.ItemView.extend({

    tagName: 'tr',
    className: 'empty',
    template : function() {
      return _.template('<td colspan="6"><%- empty %></td>', { empty: I18n.t('jst.apiKeysTable.empty') });
    }
  });

  var ApiKeyRow = Backbone.Marionette.ItemView.extend({

    tagName: 'tr',
    template: 'apiKeysTable/row',
    ui: {
      identifier: '.identifier',
      sharedSecret: '.sharedSecret',
      toggleActiveButton: '.actions button.toggle',
      toggleActiveIcon: '.actions button.toggle i',
      deleteButton: '.actions button.delete'
    },

    events: {
      'click .sharedSecret a': 'showSharedSecret',
      'click .actions button.toggle': 'toggleActive',
      'click .actions button.delete': 'delete'
    },
    modelEvents: {
      'change:active': 'renderIdentifier renderSharedSecret updateStatus',
      'change:sharedSecret': 'renderSharedSecret'
    },

    toggleActive: function(e) {
      e.preventDefault();
      this.ui.toggleActiveButton.attr('disabled', true);
      this.model.save({ active: !this.model.get('active') }, { wait: true });
    },

    delete: function(e) {
      e.preventDefault();
      if (confirm(I18n.t('jst.apiKeysTable.deleteConfirmation'))) {
        this.model.destroy({ wait: true });
      }
    },

    showSharedSecret: function(e) {
      e.preventDefault();
      this.model.fetch();
    },

    serializeData: function() {
      return _.extend(this.model.toJSON(), {
        humanCreatedAt: Format.datetime.long(new Date(this.model.get('createdAt'))),
        humanLastUsedAt: this.model.get('lastUsedAt') ? Format.datetime.long(new Date(this.model.get('lastUsedAt'))) : I18n.t('jst.common.noData')
      });
    },

    onRender: function() {

      this.renderIdentifier();
      this.renderSharedSecret();
      this.updateStatus();

      this.ui.deleteButton.tooltip({
        title: I18n.t('jst.apiKeysTable.delete')
      });
    },

    updateStatus: function() {

      this.$el.removeClass('success warning');
      this.$el.addClass(this.model.get('active') ? 'success' : 'warning');

      this.ui.toggleActiveButton.tooltip('destroy');
      this.ui.toggleActiveButton.tooltip({
        title: this.model.get('active') ? I18n.t('jst.apiKeysTable.disable') : I18n.t('jst.apiKeysTable.enable')
      });
      this.ui.toggleActiveButton.attr('disabled', false);
      this.ui.toggleActiveIcon.removeClass('icon-stop icon-play');
      this.ui.toggleActiveIcon.addClass(this.model.get('active') ? 'icon-stop' : 'icon-play');
    },

    renderIdentifier: function() {
      if (this.model.get('active')) {
        this.ui.identifier.text(this.model.get('id'));
      } else {
        this.ui.identifier.html($('<del />').text(this.model.get('id')));
      }
    },

    renderSharedSecret: function() {
      if (!this.model.get('active')) {
        this.ui.sharedSecret.text(new Array(51).join('*'));
      } else if (this.model.get('sharedSecret')) {
        this.ui.sharedSecret.text(this.model.get('sharedSecret'));
      } else {
        this.ui.sharedSecret.html($('<a href="#" />').text(new Array(51).join('*')).tooltip({
          title: 'Click to show',
          placement: 'right'
        }));
      }
    }
  });

  var ApiKeysTableView = Tableling.Bootstrap.TableView.extend({

    template: 'apiKeysTable/table',
    itemView: ApiKeyRow,
    itemViewContainer: 'tbody',
    emptyView: NoApiKeyRow
  });

  var ApiKeysTable = Table.extend({

    template: 'apiKeysTable/layout',
    ui: {
      newButton: '.header button.new'
    },

    events: {
      'click .header button.new': 'createKey'
    },

    pageSizeViewOptions : {
      sizes : [ 5, 10, 15 ]
    },

    config: {
      pageSize: 5,
      sort: [ 'createdAt desc' ]
    },
    fetchOptions: {
      reset: true
    },

    tableView: ApiKeysTableView,

    createKey: function(e) {
      e.preventDefault();
      this.ui.newButton.attr('disabled', true);
      new ApiKey().save({}, {
        wait: true,
        success: _.bind(function() {
          this.ui.newButton.attr('disabled', false);
          this.update({ sort: [ 'createdAt desc' ] });
        }, this)
      });
    }
  });

  this.addAutoInitializer(function(options) {
    options.region.show(new ApiKeysTable(_.extend(options.config, {
      collection: new ApiKeyCollection()
    })));
  });
});
