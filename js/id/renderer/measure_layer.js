iD.MeasureLayer = function() {
    var projection,
        gj = {},
        enable = true,
        svg,
        markers = [{
            id: 'measureCircle',
            w: 10,
            h: 10,
            x: 5,
            y: 5,
            t: '<circle cx="5" cy="5" r="5" class="measure tail"/>',
            u: 'userSpaceOnUse'
        }];

    function render(selection) {
        svg = selection.selectAll('svg')
            .data([render]);

        var defs = svg.enter()
            .append('svg')
            .append('defs');

        var m = defs.selectAll('marker')
            .data(markers);
        m.enter().append('marker')
            .attr('id', function(d) { return d.id; })
            .attr('markerWidth', function(d) { return d.w; })
            .attr('markerHeight', function(d) { return d.h; })
            .attr('refX', function(d) { return d.x; })
            .attr('refY', function(d) { return d.y; })
            .attr('orient', function(d) { return d.o; })
            .attr('markerUnits', function(d) { return d.u; })
            .html(function(d) { return d.t; });

        svg.style('display', enable ? 'block' : 'none');


        var paths = svg
            .selectAll('path.measure.line')
            .data([gj]);

        paths
            .enter()
            .append('path')
            .attr('class', 'measure line')
            .attr('style', 'marker-end: url(#markerMeasure);')
            //.attr('style', 'marker-start: url(#markerCircle); marker-end: url(#markerMeasure);')
            ;

        var path = d3.geo.path()
            .projection(projection);

        paths
            .attr('d', path);
    }

    render.projection = function(_) {
        if (!arguments.length) return projection;
        projection = _;
        return render;
    };

    render.enable = function(_) {
        if (!arguments.length) return enable;
        enable = _;
        return render;
    };

    render.geojson = function(_) {
        if (!arguments.length) return gj;
        gj = _;
        return render;
    };

    render.dimensions = function(_) {
        if (!arguments.length) return svg.dimensions();
        svg.dimensions(_);
        return render;
    };

    render.id = 'layer-measure';

    return render;
};
