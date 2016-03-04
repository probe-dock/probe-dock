angular.module('probedock.categorySelect').directive('categorySelect', function() {
  return {
    restrict: 'E',
    controller: 'CategorySelectCtrl',
    templateUrl: '/templates/components/category-select/select.template.html',
    scope: {
      organization: '=',
      modelObject: '=',
      modelProperty: '@',
      prefix: '@',
      createNew: '=?',
      autoSelect: '=?',
      placeholder: '@',
      label: '@',
      noLabel: '=?',
      multiple: '=?',
      extract: '@'
    }
  };
}).controller('CategorySelectCtrl', function(api, $scope) {
  if (!$scope.prefix) {
    throw new Error("The prefix attribute on category-select directive is not set.");
  }

  _.defaults($scope, {
    modelProperty: $scope.multiple ? 'categoryNames' : 'categoryName',
    placeholder: 'All categories',
    label: 'Category',
    extract: 'name',
    multiple: false,
    noLabel: false,
    config: {
      newCategory: false
    },
    categoryChoices: []
  });

  $scope.$watch('organization', function(value) {
    if (value) {
      $scope.fetchCategoryChoices();
    }
  });

  $scope.$watch('config.newCategory', function(value) {
    if (value) {
      var previousCategory = $scope.modelObject[$scope.modelProperty];
      // create a new object if a new category is to be created
      $scope.modelObject[$scope.modelProperty] = {};
      // pre-fill it with either the previously selected category, or empty string
      $scope.modelObject[$scope.modelProperty] = previousCategory ? previousCategory : '';
    } else if (value === false && $scope.categoryChoices.length && $scope.autoSelect) {
      // auto-select the first existing category when disabling creation of a new category
      $scope.modelObject[$scope.modelProperty] = $scope.categoryChoices[0][$scope.extract];
    }
  });

  $scope.fetchCategoryChoices = function(categoryName) {
    var params = {
      organizationId: $scope.organization.id
    };

    if (categoryName) {
      params.search = categoryName;
    }

    api({
      url: '/categories',
      params: params
    }).then(function(res) {
      $scope.categoryChoices = res.data;

      if ($scope.categoryChoices.length && $scope.autoSelect) {
        // if categories are found, automatically select the first one
        $scope.modelObject[$scope.modelProperty] = $scope.categoryChoices[0][$scope.extract];
      } else if (!$scope.categoryChoices.length && $scope.createNew) {
        // if there are no existing categories and category creation is
        // enabled, automatically switch to the free input field
        $scope.config.newCategory = true;
      }
    });
  }
});