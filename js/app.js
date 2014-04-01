define(['vendor/underscore', 'vendor/d3'], function(_, d3) {
  return function() {
    var SMOOTH = 3,
      INIT = {
        alwaysOn: true,
        cooking: true,
        dryer: false,
        heatingAC: false,
        other: false,
        refrigeration: false,
        average: true
      },
      rows,
      data = {},
      styles = {
        alwaysOn: '00C',
        cooking: '88C',
        dryer: '66C',
        heatingAC: '22C',
        other: 'AAC',
        refrigeration: '44C',
        average: 'FF8500'
      },
      getIdx = function(idx, total) {
        if (idx < 0) return 0;
        if (idx >= total) return total-1;
        return idx
      },
      smooth = function(idx, num) {
        return _(new Array(num*2+1)).map(function(key, i) {
          return idx+(i-num);
        });
      },
      avg = function(rows, idx) {
        return _.chain(smooth(idx, SMOOTH)).map(function(val) {
          return getIdx(val, rows.length);
        }).reduce(function(memo, idx) {
          return memo + _.chain(rows[idx]).filter(function(value, key) {
            var control = d3.select('#'+key+'-box');
            return key !== 'average' ? (control[0][0] ? control : {
              property: function() {
                return false;
              }
            }).property('checked') : false;
          }).map(function(value) {
            return +value/6 || 0;
          }).reduce(function(mem, val) {
            return mem + val;
          }, 0).value();
        }, 0).value() / (SMOOTH * 2 + 1);
      },
      setAverage = function() {
        var average = [];
        for (var i = 0; i < rows.length; i++) {
          average[i] = {
            val: avg(rows, i),
            time: data.alwaysOn[i].time
          };
        }
        return average;
      },
      // map categorical data into arrays
      mapData = function(err, rws) {
        rows = rws;
        data = _.chain(rows[0]).keys().map(function(key) {
          return [
            key,
            _(rows).map(function(point, idx) {
              return {
                val: +point[key]/6 || null,
                time: new Date(rows[idx].timeMid.replace(/T/g, ' '))
              };
            })
          ];
        }).object().value();

        data.average = setAverage();

        draw();
      },
      drawControls = _.once(function() {
        var names = {
            alwaysOn: 'Always On',
            cooking: 'Cooking',
            dryer: 'Dryer',
            heatingAC: 'Heating/AC',
            other: 'Other',
            refrigeration: 'Refrigeration',
            average: 'Average'
          }, $select;

        _(data).each(function(dataSet, name) {
          if (name === 'timeMid') return;
          var container = d3.select('#controls')
            .append('div')
            .on('mouseover', function() {
              d3.selectAll('.line')
                .classed('fade', true);
              d3.select('.line-'+name)
                .classed('vis', true)
                .classed('fade', false);
            })
            .on('mouseout', function() {
              d3.selectAll('.line')
                .classed('fade', false)
                .classed('vis', false);
            });
          container
            .append('input')
            .attr({
              id: name+'-box',
              'data-set': name,
              type: 'checkbox'
            })
            .property('checked', INIT[name])
            .on('change', function(evt) {
              var $box = d3.select(this);
              d3.select('.line-'+$box.attr('data-set'))
                .classed('hidden', !$box.property('checked'));
              updateAvg();
            });
          container
            .append('label')
            .attr({
              for: name+'-box'
            })
            .style('color', '#'+styles[name])
            .html((name === 'average') ? ('<span id="select-port"></span> day average (total)') : names[name]);
          $select = d3.select('#select-port')
            .append('select');
          $select
            .selectAll('option')
            .data(_(new Array(10)).map(function(v, i) { return i*2+1; }))
            .enter()
            .append('option')
            .attr('value', function(d) { return d; })
            .property('selected', function(d) { return d === SMOOTH*2+1 ? true : false; })
            .text(function(d) { return d; });
          $select
            .on('change', function() {
              SMOOTH = (d3.select(this).node().value - 1) / 2;
              updateAvg();
            });
        });
      }),
      updateAvg,
      // draw containing svg and render lines
      draw = function(resize) {
        d3.select('#vis-container svg')
          .remove();
        var count = 0,
          width = window.innerWidth-120,
          height = window.innerHeight-125,
          margin = {
            l: 60,
            t: 10
          },
          x = d3.time.scale()
            .range([0, width]),
          y = d3.scale.pow().exponent(.3)
            .range([height, 0]),
          xAxis = d3.svg.axis()
            .scale(x)
            .ticks(d3.time.weeks, 2)
            .orient('bottom'),
          yAxis = d3.svg.axis()
            .scale(y)
            .orient('left'),
          line = d3.svg.line()
            .interpolate('basis')
            .x(function(d) {
              return x(d.time);
            })
            .y(function(d) {
              return y(d.val);
            }),
          svg = d3.select('#vis-container').append('svg'),
          xAxisNode = svg.append('g'),
          graphs = svg.append('g');
        updateAvg = function(resize) {
          graphs.selectAll('.line-average')
            .data([setAverage()])
            .transition().duration(resize || 500)
            .attr('d', line);
        };

        x.domain(d3.extent(_(data.timeMid).pluck('time'), function(d) { return d; }));
        y.domain(d3.extent([0,12], function(d) { return d; }));

        svg.attr({
          width: width+100,
          height: height+50
        });

        xAxisNode
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
            y: -37,
            x: -height/2+60
          })
          .style('text-anchor', 'end')
          .text('kW');

        drawControls();

        _(data).each(function(dataSet, name) {
          if (name === 'timeMid') return;
          graphs.selectAll('.line-'+name)
            .data([dataSet])
            .enter()
            .append('svg:path')
            .attr({
              transform: 'translate(' + margin.l + ',' + margin.t + ')',
              class: 'line line-'+name+(d3.select('#'+name+'-box').property('checked') ? '' : ' hidden'),
              style: 'stroke: #' + styles[name],
              d: line
            });
        });

        updateAvg(resize);
      };

    // fetch .csv file
    this.init = function() {
      d3.csv('data/appliance.csv', mapData);
    }

    d3.select(window)
      .on('resize', function() {
        draw(1);
      });
  };
});