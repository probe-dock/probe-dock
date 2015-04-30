angular.module('probe-dock.nav', [ 'probe-dock.orgs', 'probe-dock.profile' ])

  .controller('NavCtrl', function(api, orgs, profile, $rootScope, $scope, $state) {

    var state = $state.current;
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toStateParams) {
      state = toState;
      $scope.orgName = toStateParams.orgName;
    });

    $scope.baseStateIs = function() {
      var names = Array.prototype.slice.call(arguments);
      return _.some(names, function(name) {
        return state && state.name && state.name.indexOf(name) === 0;
      });
    };

    profile.forwardData($scope);
    orgs.forwardData($scope);
  })

;
