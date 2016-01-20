angular.module('probedock.dashboard', [ 'probedock.api', 'probedock.orgs', 'probedock.reports' ])

  .controller('DashboardCtrl', function(api, orgs, $scope, $stateParams) {

    orgs.forwardData($scope);

    $scope.orgIsActive = function() {
      return $scope.currentOrganization && $scope.currentOrganization.projectsCount && $scope.currentOrganization.membershipsCount;
    };

    $scope.gettingStarted = false;

    api({
      url: '/reports',
      params: {
        pageSize: 1,
        organizationName: $stateParams.orgName
      }
    }).then(function(res) {
      if (!res.pagination().total) {
        $scope.gettingStarted = true;
      }
    });
  })

  .controller('DashboardHeaderCtrl', function(orgs, $scope, $state, $stateParams) {

    var modal;
    $scope.currentState = $state.current.name;

    $scope.$on('$stateChangeSuccess', function(event, toState) {

      $scope.currentState = toState.name;

      if (toState.name == 'org.dashboard.default.edit') {
        modal = orgs.openForm($scope);

        modal.result.then(function() {
          $state.go('^', {}, { inherit: true });
        }, function(reason) {
          if (reason != 'stateChange') {
            $state.go('^', {}, { inherit: true });
          }
        });
      }
    });
  })

  .directive('newTestsLineChart', function() {
    return {
      restrict: 'E',
      controller: 'NewTestsLineChartCtrl',
      templateUrl: '/templates/new-tests-line-chart.html',
      scope: {
        organization: '=',
        projectId: '='
      }
    };
  })

  .controller('NewTestsLineChartCtrl', function(api, $scope) {

    var chartConfig = {
      written: {
        url: '/metrics/newTestsByDay',
        tooltipTemplate: '<%= value %> new tests on <%= label %>',
        valueFieldName: 'testsCount'
      },
      run: {
        url: '/metrics/reportsByDay',
        tooltipTemplate: '<%= value %> runs on <%= label %>',
        valueFieldName: 'runsCount'
      }
    };

    $scope.chart = {
      data: [],
      labels: [],
      params: {
        projectIds: [],
        userIds: [],
        type: 'written'
      },
      options: {
        pointHitDetectionRadius: 5,
        // Will be set from chartConfig based on chart type
        tooltipTemplate: '',
        scaleLabel: function(object) {
          return '  ' + object.value;
        }
      }
    };

    $scope.projectChoices = [];

    // TODO: replace users by contributors
    $scope.userChoices = [];

    $scope.$watch('organization', function(value) {
      if (value) {
        fetchMetrics();
        fetchUserChoices();

        if (!$scope.projectId) {
          fetchProjectChoices();
        }
      }
    });

    var ignoreChartParams = true;
    $scope.$watch('chart.params', function(value) {
      if (value && !ignoreChartParams) {
        fetchMetrics();
      }

      ignoreChartParams = false;
    }, true);

    function fetchProjectChoices() {
      api({
        url: '/projects',
        params: {
          organizationId: $scope.organization.id
        }
      }).then(function(res) {
        $scope.projectChoices = res.data;
      });
    }

    function fetchUserChoices() {
      api({
        url: '/users',
        params: {
          organizationId: $scope.organization.id
        }
      }).then(function(res) {
        $scope.userChoices = res.data;
      });
    }

    function fetchMetrics() {
      if ($scope.projectId) {
        $scope.chart.params.projectIds = [$scope.projectId];
      }

      return api({
        url: chartConfig[$scope.chart.params.type].url,
        params: _.extend({}, _.omit($scope.chart.params, 'type'), {
          organizationId: $scope.organization.id
        })
      }).then(showMetrics);
    }

    function showMetrics(response) {
      if (!response.data.length) {
        return;
      }

      $scope.chart.options.tooltipTemplate = chartConfig[$scope.chart.params.type].tooltipTemplate;

      var series = [];
      $scope.chart.data = [ series ];
      $scope.chart.labels.length = 0;
      $scope.totalCount = 0;

      var fieldName = chartConfig[$scope.chart.params.type].valueFieldName;

      _.each(response.data, function(data) {
        $scope.chart.labels.push(moment(data.date).format('DD.MM'));
        series.push(data[fieldName]);
        $scope.totalCount += data[fieldName];
      });
    }
  })

  .controller('DashboardTagCloudCtrl', function(api, $scope, $stateParams) {

    fetchTags().then(showTags);

    function fetchTags() {
      return api({
        url: '/tags',
        params: {
          organizationName: $stateParams.orgName
        }
      });
    }

    function showTags(response) {
      $scope.tags = _.reduce(response.data, function(memo, tag) {

        memo.push({
          text: tag.name,
          weight: tag.testsCount
        });

        return memo;
      }, []);
    }
  })

  .directive('recentActivity', function() {
    return {
      restrict: 'E',
      controller: 'RecentActivityCtrl',
      controllerAs: 'ctrl',
      templateUrl: '/templates/recent-activity.html',
      scope: {
        organization: '='
      }
    };
  })

  .controller('RecentActivityCtrl', function(api, orgs, $scope) {
    orgs.forwardData($scope);

    $scope.$watch('organization', function(value) {
      if (value) {
        fetchReports();
      }
    });

    function fetchReports() {
      return api({
        url: '/reports',
        params: {
          pageSize: 5,
          organizationId: $scope.organization.id,
          withRunners: 1,
          withProjects: 1,
          withProjectVersions: 1,
          withCategories: 1
        }
      }).then(showReports);
    }

    function showReports(response) {
      $scope.reports = response.data;
    }
  })

;
