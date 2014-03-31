define(['vendor/underscore', 'vendor/d3'], function(_, d3) {
  return function() {
    var data = {},
      // map categorical data into arrays
      mapData = function(err, rows) {
        data = _.chain(rows[0]).keys().map(function(key) {
          return [
            key,
            _(rows).map(function(point, idx) {
              return {
                val: +point[key],
                time: +(new Date(rows[idx].timeMid.replace(/T/g, ' ')))
              };
            })
          ];
        }).object().value();
        console.log(data);
      },
      // draw containing svg
      draw = function() {
        var x = d3.scale.linear()
            .range([0, 800]),
          y = d3.scale.linear()
            .range([400, 0]),
          xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom"),
          yAxis = d3.svg.axis()
            .scale(y)
            .orient("left"),
          container = d3.select(".test-container")
            .insert('div', ':first-child')
              .attr({
                class: 'test-wrapper',
                width: Math.max(140+count, 280)+'px'
              }),
          line = d3.svg.line()
            .interpolate('basis')
            .x(function(d) { return x(d.id); })
            .y(function(d) { return y(d.ms); });

        // d3.select('#vis-container')
        //   .
      };

    // fetch .csv file
    this.init = function() {
      d3.csv('data/appliance.csv', mapData);
    }
  };
});