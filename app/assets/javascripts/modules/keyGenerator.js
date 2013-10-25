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

App.autoModule('keyGenerator', function() {

  var models = App.module('models'),
      Project = models.Project,
      ProjectCollection = models.ProjectCollection;

  var KeyView = Backbone.Marionette.ItemView.extend({
    tagName: 'span',
    template: _.template('<span class="label label-success"><%- value %></span><span>&nbsp;</span>')
  });

  var NoKeyView = Backbone.Marionette.ItemView.extend({

    tagName: 'em',
    className: 'instructions',
    template: false,

    onRender: function() {
      this.$el.text(I18n.t('jst.keyGenerator.instructions'));
    }
  });

  var ProjectKeysView = Backbone.Marionette.CompositeView.extend({

    template: _.template('<p><strong><%- name %></strong></p>'),
    className: 'projectKeys',
    itemView: KeyView,

    initialize: function() {
      this.collection = this.model.get('testKeys');
    }
  });

  var MainView = Backbone.Marionette.CompositeView.extend({

    template: 'keyGenerator/layout',
    ui: {
      keys: '.keys',
      project: '.project',
      generate: 'form .generate',
      release: 'form .release',
      numberOfKeys: 'form [name="n"]',
      error: '.text-error'
    },

    itemView: ProjectKeysView,
    emptyView: NoKeyView,
    itemViewContainer: '.well',

    events: {
      'click form .generate': 'generateNewKeys',
      'click form .release': 'releaseUnusedKeys'
    },

    initialize: function(options) {

      this.path = options.path;
      this.projects = options.projects;

      this.collection = new ProjectCollection();
      this.addKeys(options.freeKeys);
    },

    onRender: function() {
      this.setupProject();
      this.ui.error.hide();
    },

    addNewKeys: function(response) {
      this.addKeys(response._embedded['v1:test-keys']);
      this.setControlsEnabled(true);
    },

    addKeys: function(keys) {

      _.each(keys, function(key) {

        var project = this.collection.find(function(p) {
          return p.get('apiId') == key.projectApiId;
        }, this);

        if (!project) {
          project = new Project(_.findWhere(this.projects, { apiId: key.projectApiId }));
          this.collection.add(project);
        }

        project.get('testKeys').add(key);
      }, this);
    },

    setupProject: function() {

      if (!this.projects || !this.projects.length) {
        return;
      }

      this.ui.project.find('option').remove();
      _.each(this.projects, function(project) {
        $('<option />').val(project.apiId).text(project.name).appendTo(this.ui.project);
      }, this);
      this.ui.project.attr('disabled', false);
    },

    removeKeys: function() {
      this.collection.remove(this.collection.models);
      this.setControlsEnabled(true);
    },

    generateNewKeys: function() {

      this.ui.error.hide();
      this.setControlsEnabled(false);

      $.ajax({
        url: this.path + '?' + $.param({ n: this.ui.numberOfKeys.val() }),
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
          projectApiId: this.ui.project.val()
        })
      }).done(_.bind(this.addNewKeys, this)).fail(_.bind(this.showGenerationError, this));
    },

    releaseUnusedKeys: function() {

      this.ui.error.hide();
      this.setControlsEnabled(false);

      $.ajax({
        url: this.path,
        type: 'DELETE',
        dataType: 'json'
      }).done(_.bind(this.removeKeys, this)).fail(_.bind(this.showReleaseError, this));;
    },

    setControlsEnabled: function(enabled) {
      this.ui.generate.attr('disabled', !enabled);
      this.ui.release.attr('disabled', !enabled);
    },

    showGenerationError: function() {
      this.ui.error.text(I18n.t('jst.keyGenerator.errors.generate')).show();
      this.setControlsEnabled(true);
    },

    showReleaseError: function() {
      this.ui.error.text(I18n.t('jst.keyGenerator.errors.release')).show();
      this.setControlsEnabled(true);
    }
  });

  this.addAutoInitializer(function(options) {
    options.region.show(new MainView(options.config));
  });
});
