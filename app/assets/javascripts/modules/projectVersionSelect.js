angular.module('probedock.projectVersionSelect', [ 'probedock.api' ])
  .directive('projectVersionSelect', function() {
    return {
      restrict: 'E',
      controller: 'ProjectVersionSelectCtrl',
      templateUrl: '/templates/project-version-select.html',
      scope: {
        project: '=',
        modelObject: '=',
        modelProperty: '@',
        latestVersion: '=',
        prefix: '@'
      }
    };
  })

  .controller('ProjectVersionSelectCtrl', function(api, $scope) {
    if (!$scope.prefix) {
      throw new Error("The prefix attribute on project-version-select directive is not set.");
    }

    if (!$scope.modelProperty) {
      $scope.modelProperty = "projectVersion";
    }

    $scope.projectVersionChoices = [];

    $scope.$watch('project', function(value) {
      if (value) {
        fetchProjectVersionChoices();
      }
    });

    function fetchProjectVersionChoices() {
      api({
        url: '/projectVersions',
        params: {
          projectId: $scope.project.id
        }
      }).then(function(res) {
        $scope.projectVersionChoices = res.data;
      });
    }
  })
;