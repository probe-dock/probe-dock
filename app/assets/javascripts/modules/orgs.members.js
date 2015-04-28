angular.module('probe-dock.orgs.members', [ 'probe-dock.api' ])

  .factory('orgMembers', function(api, $modal) {

    var service = {
      openForm: function($scope) {

        var modal = $modal.open({
          templateUrl: '/templates/org-member-modal.html',
          controller: 'OrgMemberModalCtrl',
          scope: $scope
        });

        $scope.$on('$stateChangeSuccess', function() {
          modal.dismiss('stateChange');
        });

        return modal;
      }
    };

    return service;
  })

  .controller('OrgMembersCtrl', function(api, orgMembers, $scope, $state, $stateParams) {

    $scope.memberships = [];
    fetchMemberships();

    $scope.organizationRoles = [ 'admin' ];

    $scope.$on('$stateChangeSuccess', function(event, toState) {
      if (toState.name.match(/^org\.dashboard\.members\.(?:new|edit)$/)) {

        var modal = orgMembers.openForm($scope);

        modal.result.then(function() {
          $state.go('^', {}, { inherit: true });
        }, function(reason) {
          if (reason != 'stateChange') {
            $state.go('^', {}, { inherit: true });
          }
        });
      }
    });

    $scope.remove = function(membership) {

      var message = "Are you sure you want to remove ";
      message += membership.user ? membership.user.name : membership.organizationEmail;
      message += "'s membership?";

      if (!confirm(message)) {
        return;
      }

      api({
        method: 'DELETE',
        url: '/api/memberships/' + membership.id
      }).then(function() {
        $scope.memberships.splice($scope.memberships.indexOf(membership), 1);
      });
    };

    function fetchMemberships(page) {
      page = page || 1;

      api({
        url: '/api/memberships',
        params: {
          organizationName: $stateParams.orgName,
          withUser: 1,
          pageSize: 25,
          page: page
        }
      }).then(function(res) {
        $scope.memberships = $scope.memberships.concat(res.data);
        // FIXME: use pagination to determine if more records are available
        if (res.data.length == 25) {
          fetchMemberships(++page);
        }
      });
    }
  })

  // TODO: display message if user is aleady a member
  .controller('OrgMemberModalCtrl', function(api, forms, $modalInstance, orgs, $scope, $stateParams) {

    orgs.forwardData($scope);

    $scope.membership = {
      organizationId: $scope.currentOrganization.id
    };

    reset();

    if ($stateParams.id) {
      api({
        url: '/api/memberships/' + $stateParams.id,
        params: {
          withUser: 1
        }
      }).then(function(res) {
        $scope.membership = res.data;
        reset();
      });
    }

    $scope.reset = reset;
    $scope.changed = function() {
      return !forms.dataEquals($scope.membership, $scope.editedMembership);
    };

    $scope.save = function() {

      var method = 'POST',
          url = '/api/memberships';

      if ($scope.membership.id) {
        method = 'PATCH';
        url += '/' + $scope.membership.id;
      }

      api({
        method: method,
        url: url,
        data: $scope.editedMembership
      }).then(function(res) {
        $modalInstance.close(res.data);
      });
    };

    function reset() {
      $scope.editedMembership = angular.copy($scope.membership);
    }
  })

  .controller('NewMembershipCtrl', function(api, auth, $modal, $scope, $state, $stateParams) {

    api({
      url: '/api/memberships',
      params: {
        otp: $stateParams.otp,
        withOrganization: 1
      }
    }).then(function(res) {
      $scope.membership = res.data.length ? res.data[0] : null;
      $scope.invalidOtp = !res.data.length;
    }, function(err) {
      if (err.status == 403) {
        $scope.invalidOtp = true;
      }
    });

    $scope.openSignInDialog = auth.openSignInDialog;

    $scope.emailisNew = function() {
      return !_.some(auth.currentUser.emails, function(email) {
        return email.address == $scope.membership.organizationEmail;
      });
    };

    $scope.openRegistrationDialog = function() {
      $modal.open({
        scope: $scope,
        controller: 'NewMembershipRegistrationCtrl',
        templateUrl: '/templates/new-membership-register-modal.html'
      });
    };

    $scope.accept = function() {
      api({
        method: 'PATCH',
        url: '/api/memberships/' + $scope.membership.id,
        params: {
          otp: $stateParams.otp
        },
        data: {
          userId: auth.currentUser.id
        }
      }).then(function() {
        $state.go('org.dashboard.default', { orgName: $scope.membership.organization.name });
      });
    };
  })

  .controller('NewMembershipRegistrationCtrl', function(api, auth, $modalInstance, $scope, $state, $stateParams) {

    $scope.user = {
      primaryEmail: $scope.membership.organizationEmail
    };

    $scope.newUser = angular.copy($scope.user);

    $scope.register = function() {
      register().then(autoSignIn).then(function() {
        $modalInstance.dismiss();
        $state.go('org.dashboard.default', { orgName: $scope.membership.organization.name });
      });
    };

    $scope.$on('$stateChangeSuccess', function() {
      $modalInstance.dismiss('stateChange');
    });

    function register() {
      return api({
        method: 'POST',
        url: '/api/users',
        params: {
          membershipOtp: $stateParams.otp
        },
        data: $scope.newUser
      });
    }

    function autoSignIn() {
      return auth.signIn({
        username: $scope.newUser.name,
        password: $scope.newUser.password
      });
    }
  })

;