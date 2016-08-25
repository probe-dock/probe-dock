angular.module('probedock.newTestsWidget').controller('NewTestsContentCtrl', ['$scope', 'api', function ($scope, api) {

  _.defaults($scope, {
    user: null,
    hideSelect: false,
    params: {
      userId: null
    }
  });

  var width = $('.newtests-widget').width(),
    height = 200,
    colorRange = ["#eeeeee", "#446e9b"],
    days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    now,
    dateAt,
    RECT_SIZE = 11,
    RECT_PADDING = 2,
    MONTH_LABEL_PADDING = 6,
    PADDING_TOP = 20,
    PADDING_LEFT = 20,
    WIDTH_MIN = 700,
    svg;

  $(window).resize(function () {
    width = $('.newtests-widget').width();
    if ($scope.data.length !== 0) {
      if (WIDTH_MIN > width) {
        $scope.getNewTests();
      } else {
        now = moment().endOf('day').toDate();
        dateAt = moment().startOf('day').subtract(1, 'year').startOf('week').toDate();
        svg.selectAll('*').remove();
        chart($scope.data);
      }
    }
  });

  /**
   * Initialize the svg
   * @param element class or ID to display the heatmap
   */
  var setup = function (element) {
    svg = d3.select(element)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "new-tests-svg, hidden-xs")
      .style('margin-left', '5px');
  };

  /**
   * Generate the chart
   * @param value data
   */
  var chart = function (value) {

    // Set date
    var dateRange = d3.time.days(dateAt, now);
    var monthRange = d3.time.months(moment(dateAt).startOf('month').toDate(), now);
    var firstDate = moment(dateRange[0]);

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function (d) {
        var dateStr = moment(d).format('ddd, MMM Do YYYY');
        var count = countForDate(d);
        return '<span><strong>' + (count ? count : 'No') + ' new test' + (count > 1 ? 's' : '') +
          '</strong> on ' + dateStr + '</span>';
      });

    svg.call(tip);

    // Max data value
    var max = d3.max(value, function (d) {
      return d.count;
    });

    // Set color range
    var color = d3.scale.linear()
      .range(colorRange)
      .domain([0, max]);

    // Day rectangle
    var dayRects = svg.selectAll('.day-cell')
      .data(dateRange);

    // Set the cells
    dayRects.enter().append('rect')
      .attr('class', 'day-cell')
      .attr('width', RECT_SIZE)
      .attr('height', RECT_SIZE)
      .attr('fill', colorRange[0]) // First color
      .attr('x', function (d) {
        var cellDate = moment(d);
        var result = cellDate.week() - firstDate.week() + (firstDate.weeksInYear() *
          (cellDate.weekYear() - firstDate.weekYear()));
        return result * (RECT_SIZE + RECT_PADDING) + PADDING_LEFT;
      })
      .attr('y', function (d) {
        return MONTH_LABEL_PADDING + d.getDay() * (RECT_SIZE + RECT_PADDING) + PADDING_TOP;
      });

    // Mouse event on cells
    dayRects.on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    // Set legend
    var colors = [color(0)];
    for (var i = 3; i > 0; i--) {
      colors.push(color(max / i));
    }

    var legend = svg.append('g');
    legend.selectAll('.heatmap-legend')
      .data(colors)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-legend')
      .attr('width', 11)
      .attr('height', 11)
      .attr('x', function (d, i) {
        return 50 + (i + 1) * 13;
      })
      .attr('y', height - 50)
      .attr('fill', function (d) {
        return d;
      });

    // Less text
    legend.append('text')
      .attr('class', 'heatmap-legend-text')
      .attr('x', 20)
      .attr('y', height - 40)
      .text('Less');

    // More text
    legend.append('text')
      .attr('class', 'heatmap-legend-text')
      .attr('x', 60 + (colors.length + 1) * 13)
      .attr('y', height - 40)
      .text('More');

    dayRects.exit().remove();

    // x-axis : month
    svg.selectAll('.month')
      .data(monthRange)
      .enter().append('text')
      .attr('class', 'month-name')
      .style()
      .text(function (d) {
        return months[d.getMonth()];
      })
      .attr('x', function (d) {
        var matchIndex = 0;
        dateRange.find(function (element, index) {
          matchIndex = index;
          return moment(d).isSame(element, 'month') && moment(d).isSame(element, 'year');
        });

        return Math.floor(matchIndex / 7) * 13 + PADDING_LEFT;
      })
      .attr('y', PADDING_TOP);

    // y-axis : day
    days.forEach(function (day, index) {
      if (index % 2) {
        svg.append('text')
          .attr('class', 'day-initial')
          //.attr('transform', 'translate(-8,' + PADDING_TOP + (RECT_SIZE + RECT_PADDING) * (index + 1) + ')')
          .style('text-anchor', 'middle')
          .attr('y', PADDING_TOP + (RECT_SIZE + RECT_PADDING) * (index + 1))
          .attr('x', PADDING_LEFT / 2)
          .text(day);
      }
    });

    // Get all days
    var daysOfChart = value.map(function (day) {
      return new Date(day.date).toDateString();
    });

    // Set cell color
    dayRects.filter(function (d) {
      return daysOfChart.indexOf(d.toDateString()) > -1;
    }).attr('fill', function (d, i) {
      return color(value[i].count);
    });

    // Get the count for a date
    function countForDate(d) {
      var count = 0;
      var match = value.find(function (element) {
        return moment(element.date).isSame(d, 'day');
      });
      if (match) {
        count = match.count;
      }
      return count;
    }
  };

  setup('.newtests-chart');

  $scope.$watch('params', function () {
    if ($scope.params.userId !== null || $scope.user !== null) {
      $scope.getNewTests();
    }
  }, true);

  /**
   * Get new tests for a contributor
   */
  $scope.getNewTests = function () {
    var nowParam = moment().endOf('day').format('YYYY-MM-DD'),
      dateAtParam;

    now = moment().endOf('day').toDate();
    if (WIDTH_MIN > width) {
      dateAt = moment().startOf('day').subtract(6, 'month').startOf('week').toDate();
      dateAtParam = moment().startOf('day').subtract(6, 'month').format('YYYY-MM-DD');
    } else {
      dateAt = moment().startOf('day').subtract(1, 'year').startOf('week').toDate();
      dateAtParam = moment().startOf('day').subtract(1, 'year').format('YYYY-MM-DD');
    }

    var user = $scope.user !== null ? $scope.user.id : $scope.params.userId;
    $scope.data = [];
    if (typeof $scope.organization !== 'undefined' && $scope.organization !== null && $scope.organization.id !== null) {
      api({
        url: '../vizapi/testsResult?author=' + user + '&dateAt=' + dateAtParam +
        '&dateEnd=' + nowParam + '&organization=' + $scope.organization.id
      }).then(function (res) {
        svg.selectAll('*').remove();
        if (res.data && res.data.data && res.data.data.length > 0) {
          $scope.data = res.data.data;
          $scope.summary = res.data.summary;
          chart($scope.data);
        }
      });
    } else {
      api({
        url: '../vizapi/testsResult?author=' + user + '&dateAt=' + dateAtParam +
        '&dateEnd=' + nowParam
      }).then(function (res) {

        svg.selectAll('*').remove();

        if (res.data && res.data.data && res.data.data.length > 0) {
          $scope.data = res.data.data;
          $scope.summary = res.data.summary;
          chart($scope.data);
        }
      });
    }
  };
}]);