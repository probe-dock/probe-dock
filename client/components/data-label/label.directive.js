function linkFn(type) {
  return function($scope) {
    if (type) {
      $scope.type = type;
    }
  };
}

function labelDirectiveFactory(attributeName, type) {
  return {
    restrict: 'E',
    templateUrl: '/templates/components/data-label/label.template.html',
    controller: 'DataLabelCtrl',
    replace: true,
    scope: {
      label: '=' + attributeName
    },
    link: linkFn(type)
  }
}

function labelsDirectiveFactory(collectionName, attributeName) {
  return {
    restrict: 'E',
    template: '<' + attributeName + '-label ng-repeat="' + attributeName + ' in collection" ' + attributeName + '="' + attributeName + '" />',
    replace: true,
    scope: {
      collection: '=' + collectionName
    }
  };
}

angular.module('probedock.dataLabel').directive('simpleLabel', function() {
  return {
    restrict: 'E',
    controller: 'DataLabelCtrl',
    templateUrl: '/templates/components/data-label/label.template.html',
    replace: true,
    scope: {
      label: '=',
      type: '@'
    },
    link: linkFn()
  };
}).directive('projectVersionLabel', function() {
  return {
    restrict: 'E',
    templateUrl: '/templates/components/data-label/project-version-label.template.html',
    replace: true,
    scope: {
      organization: '=',
      project: '=',
      projectVersion: '=',
      linkable: '=?'
    },
    link: function($scope) {
      if (_.isUndefined($scope.linkable)) {
        $scope.linkable = true;
      }
    }
  };
}).directive('testKeyLabel', function() {
  return {
    restrict: 'E',
    scope: {
      key: '=',
      copied: '=',
      onCopied: '&'
    },
    template: '<div class="test-key-label" ng-class="{copied: copied}" clip-copy="key.key || key" clip-click="onCopied({ key: key })" tooltip="Click to copy">{{ key.key || key }}</div>'
  };
}).directive('apiIdLabel', function() {
  return {
    restrict: 'E',
    scope: {
      apiId: '='
    },
    template: '<div class="api-id-label" clip-copy="apiId">{{ apiId }}</div>'
  };
})

.directive('categoryLabel', function() { return labelDirectiveFactory('category', 'info'); })
.directive('ticketLabel', function() { return labelDirectiveFactory('ticket', 'warning'); })
.directive('tagLabel', function() { return labelDirectiveFactory('tag', 'default'); })

.directive('categoryLabels', function() { return labelsDirectiveFactory('categories', 'category') })
.directive('tagLabels', function() { return labelsDirectiveFactory('tags', 'tag')})
.directive('ticketLabels', function() { return labelsDirectiveFactory('tickets', 'ticket') })

.controller('DataLabelCtrl', function($scope) {
  $scope.getTypeClass = function() {
    return $scope.type ? 'label-' + $scope.type : '';
  };
});