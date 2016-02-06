angular.module('probedock.routes', [ 'ui.router' ])

  .config(function($stateProvider, $urlRouterProvider) {

    $stateProvider

      .state('home', {
        url: '/',
        controller: 'HomePageCtrl',
        templateUrl: '/templates/pages/home/home.template.html'
      })

      .state('home.newOrg', {
        url: 'new'
      })

      .state('error', {
        url: '/error/:type',
        controller: 'ErrorPageCtrl',
        templateUrl: '/templates/pages/error/error.template.html'
      })

      .state('permalinks', {
        url: '/go/:target',
        controller: 'PermalinksCtrl',
        templateUrl: '/templates/permalinks.html'
      })

      .state('help', {
        url: '/help',
        abstract: true,
        template: '<div ui-view />'
      })

      .state('help.gettingStarted', {
        url: '/getting-started?organizationId&projectId',
        controller: 'GettingStartedPageCtrl',
        templateUrl: '/templates/pages/getting-started/started.template.html'
      })

      .state('newMembership', {
        url: '/new-member?otp',
        controller: 'NewMembershipCtrl',
        templateUrl: '/templates/new-membership.html'
      })

      .state('register', {
        url: '/register?otp',
        controller: 'UserRegistrationCtrl',
        templateUrl: '/templates/user-registration.html'
      })

      .state('confirmRegistration', {
        url: '/confirm-registration?otp',
        controller: 'ConfirmUserRegistrationCtrl',
        templateUrl: '/templates/user-confirm-registration.html'
      })

      .state('profile', {
        url: '/profile',
        templateUrl: '/templates/profile.html'
      })

      .state('profile.edit', {
        url: '/edit'
      })

      .state('admin', {
        url: '/admin',
        abstract: true,
        template: '<div ui-view />'
      })

      .state('admin.users', {
        url: '/users',
        templateUrl: '/templates/users.html'
      })

      .state('admin.settings', {
        url: '/settings',
        controller: 'AppSettingsCtrl',
        templateUrl: '/templates/app-settings.html'
      })

      .state('admin.users.show', {
        url: '/:id'
      })

      .state('admin.users.show.edit', {
        url: '/edit'
      })

      .state('org', {
        url: '/:orgName',
        abstract: true,
        template: '<div ui-view />'
      })

      .state('org.dashboard', {
        url: '',
        abstract: true,
        controller: 'DashboardPageCtrl',
        templateUrl: '/templates/pages/dashboard/dashboard.template.html'
      })

      .state('org.dashboard.default', {
        url: '',
        templateUrl: '/templates/dashboard-default.html'
      })

      .state('org.dashboard.default.edit', {
        url: '/edit'
      })

      .state('org.dashboard.members', {
        url: '/members',
        controller: 'OrgMembersCtrl',
        templateUrl: '/templates/dashboard-members.html'
      })

      .state('org.dashboard.members.new', {
        url: '/new'
      })

      .state('org.dashboard.members.edit', {
        url: '/:id/edit'
      })

      .state('org.projects', {
        abstract: true,
        template: '<div ui-view />'
      })

      .state('org.projects.list', {
        url: '/projects',
        controller: 'ProjectsCtrl',
        templateUrl: '/templates/projects.html'
      })

      .state('org.projects.list.new', {
        url: '/new'
      })

      .state('org.projects.list.edit', {
        url: '/edit?id'
      })

      .state('org.reports', {
        url: '/reports',
        controller: 'ReportsCtrl',
        templateUrl: '/templates/reports.html'
      })

      .state('org.reports.show', {
        url: '/:id'
      })

      .state('org.tests', {
        url: '/test',
        abstract: true,
        template: '<div ui-view />'
      })

      .state('org.tests.show', {
        url: '/:testId',
        controller: 'TestCtrl',
        templateUrl: '/templates/test.html'
      })

      // Must be the last route to match any non-reserved word under /:orgName
      .state('org.projects.show', {
        url: '/:projectName',
        controller: 'ProjectCtrl',
        templateUrl: '/templates/project.html'
      })
    ;

    $urlRouterProvider.otherwise(function($injector) {
      $injector.get('$state').go('home');
    });

  })

;
