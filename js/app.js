define(['vendor/underscore', 'vendor/d3'], function(_, d3) {
  return function() {
    var data = {},
      // map categorical data into arrays
      mapData = function(err, rows) {
        data = _.chain(rows[0]).keys().map(function(key) {
          var dataSet = _(rows).map(function(row) {
            return +row[key];
          });
          return [
            key,
            _(new Array(28)).map(function(q, idx) {
              return {
                val: _.chain(new Array(28)).map(function(v,i) {
                  return dataSet[i*28+idx];
                }).reduce(function(memo, val) {
                  return memo + val;
                }).value() / 28,
                time: idx
              };
            })
          ];
        }).object().value();

        draw();
      },
      // draw containing svg
      draw = function() {
        var count = 0,
          width = window.innerWidth-300,
          height = window.innerHeight-100,
          margin = {
            l: 60,
            t: 10
          },
          styles = {
            alwaysOn: 'C00',
            cooking: 'C22',
            dryer: 'C44',
            heatingAC: 'C66',
            other: 'C88',
            refrigeration: 'CAA'
          },
          x = d3.scale.linear()
            .range([0, width]),
          y = d3.scale.pow().exponent(.5)
            .range([height, 0]),
          xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom'),
          yAxis = d3.svg.axis()
            .scale(y)
            .orient('left'),
          line = d3.svg.line()
            // .interpolate('basis')
            .x(function(d) {
              return x(d.time);
            })
            .y(function(d) {
              return y(d.val);
            }),
          svg = d3.select('#vis-container').append('svg'),
          pathTween = function(data) {
              var interpolate = d3.scale.quantile()
                .domain([0,1])
                .range(d3.range(1, data.length + 1));
              return function(t) {
                return line(data.slice(0, interpolate(t)));
              };
          };

        x.domain(d3.extent([0,27], function(d) { return d; }));
        y.domain(d3.extent([0,20], function(d) { return d; }));

        svg.attr({
          width: width+100,
          height: height+100
        });

        svg.append('g')
          .attr({
            class: 'axis x-axis',
            transform: 'translate(' + margin.l + ',' + (height + margin.t) + ')'
          })
          .call(xAxis);

        svg.append('g')
          .attr('class', 'axis y-axis')
          .attr('transform', 'translate(' + margin.l + ',' + margin.t + ')')
          .call(yAxis)
          .append('text')
          .attr({
            transform: 'rotate(-90)',
            y: -30,
            x: -180
          })
          .style('text-anchor', 'end')
          .text('kWh');;

        delete data.timeMid;

        _(data).each(function(dataSet, name) {
          svg.append('path')
            .datum(data[name])
            .attr('transform', 'translate(' + margin.l + ',' + margin.t + ')')
            .attr('class', 'line')
            .attr('style', function() { return 'stroke: #' + styles[name]; })
            .text(function(d) { return d; })
            .attr('d', line);
        });


      };

    // fetch .csv file
    this.init = function() {
      d3.csv('data/appliance.csv', mapData);
    }
  };
});