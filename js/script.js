$(document).ready(function() {
    $('.tool-options > .row').hide();
    $('.dropdown-button').dropdown();
    $('#workspace').height($('#workspace').height() - 64);
    initCanvas($('#workspace').width(), $('#workspace').height());
    $('.toolbox a.btn-flat').each(function(index) {
        $(this).click(function() {
            if (modebit !== index) {
                $('svg .selected').removeClass('selected');
            }
            modebit = index;
            $('.tool-options > .row').hide();
            $('.toolbox a.btn-flat').removeClass('light-blue');
            $('.tool-options > .row:nth-child(' + index + ')').show();
            $(this).addClass('light-blue');
        });
    });

    $('#nav-undo').click(function() {
        if (objects.length === 0) {
            return;
        }
        var obj = objects.pop();
        $('#' + obj.id).remove();
        objects_redo.push(obj);
    });

    $('#nav-redo').click(function() {
        if (objects_redo.length === 0) {
            return;
        }
        var obj = objects_redo.pop();
        switch (obj.type) {
            case 'rect':
                var rect = canvas.append('rect');
                rect.attrs({
                    'x': obj.data[0],
                    'y': obj.data[1],
                    'width': obj.data[2],
                    'height': obj.data[3],
                    'stroke-width': '1',
                    'stroke': '#F66',
                    'fill': 'rgba(38, 50, 56, 0.5)',
                    'object_id': objects.length,
                    'id': 'canvas-e' + objects.length
                });
                // rect redrawn and restored
                objects.push(obj);
                break;
            case 'polygon':
                var polygon = canvas.append('polygon');
                polygon.attrs({
                    'points': obj.data.map(function(p) {
                        return p[0] + ',' + p[1];
                    }).join(' '),
                    'stroke-width': '1',
                    'stroke': '#F66',
                    'fill': 'rgba(38, 50, 56, 0.5)',
                    'object_id': objects.length,
                    'id': 'canvas-e' + objects.length
                });
                // rect redrawn and restored
                objects.push(obj);
                break;
            default:

        }
    });

    $('.row.cmark input').change(function() {
        var shape = d3.select('svg .selected');
        shape.attr('rows', $('#cmark-rows').val());
        shape.attr('rotation', $('#cmark-rotation').val());
        shape.attr('oversize', $('#cmark-oversize').val());
        shape.attr('startClass', $('#cmark-startClass').val());
        shape.attr('startSubclass', $('#cmark-startSubclass').val());
        shape.attr('endClass', $('#cmark-endClass').val());
        shape.attr('endSubclass', $('#cmark-endSubclass').val());
    });

    $('.row.crect input').change(function() {
        var shape = d3.select('svg .selected');
        shape.attr('x', $('#crect-x').val());
        shape.attr('y', $('#crect-y').val());
        shape.attr('width', $('#crect-width').val());
        shape.attr('height', $('#crect-height').val());
        objects = objects.map(function(obj) {
            if (obj.id === shape.attr('id')) {
                return {
                    type: 'rect',
                    id: obj.id,
                    data: [
                        parseInt(shape.attr('x')),
                        parseInt(shape.attr('y')),
                        parseInt(shape.attr('width')),
                        parseInt(shape.attr('height'))
                    ]
                };
            } else {
                return obj;
            }
        });
    });

    $('.row.cpolygon input').change(function() {
        var shape = d3.select('svg .selected');
        shape.attr('points', $('#cpolygon-points').val());
    });
});

var canvas;
var modebit = 0; // 0: pointer, 1: rect, 2: poly, 3: mark, 4: text
var objects = [];
var objects_redo = [];

function initCanvas(w, h) {
    // var x = d3.scaleLinear().domain([0, d3.max(data)]).range([0, width]);
    canvas = d3.select('#canvas').attr('width', w).attr('height', h);
    var gridLine;
    var gridNum = [
        Math.floor(w / 50),
        Math.floor(h / 50)
    ];
    for (var i = 1; i <= gridNum[1]; i++) {
        gridLine = canvas.append('line').attrs({
            x1: 0,
            x2: w,
            y1: i * 50,
            y2: i * 50
        });
        gridLine.attrs({'stroke-dasharray': '1, 5', 'stroke-width': '1', 'stroke': '#AAA'});
    }

    for (var j = 1; j <= gridNum[0]; j++) {
        gridLine = canvas.append('line').attrs({
            y1: 0,
            y2: h,
            x1: j * 50,
            x2: j * 50
        });
        gridLine.attrs({'stroke-dasharray': '1, 5', 'stroke-width': '1', 'stroke': '#AAA'});
    }

    canvas.on('click', function() {
        var coords = d3.mouse(this);
        switch (modebit) {
            case 1:
                var active_rect = canvas.select('rect.active');
                if (active_rect.empty()) {
                    var rect = canvas.append('rect').classed('active', true);
                    rect.attrs({'x': coords[0], 'y': coords[1], 'stroke-width': '1', 'stroke': '#F66', 'fill': 'rgba(239, 108, 0, 0.5)'});
                    rect.attrs({'x0': coords[0], 'y0': coords[1]});
                } else {
                    var rect_w = Math.abs(coords[0] - active_rect.attr('x0'));
                    var rect_h = Math.abs(coords[1] - active_rect.attr('y0'));
                    if (coords[0] < active_rect.attr('x0')) {
                        active_rect.attr('x', coords[0]);
                    } else {
                        active_rect.attr('x', active_rect.attr('x0'));
                    }
                    if (coords[1] < active_rect.attr('y0')) {
                        active_rect.attr('y', coords[1]);
                    } else {
                        active_rect.attr('y', active_rect.attr('y0'));
                    }
                    active_rect.attr('width', rect_w).attr('height', rect_h);
                    // rect created and stored
                    confirmNewShape(active_rect);
                    objects.push({
                        type: 'rect',
                        id: 'canvas-e' + objects.length,
                        data: [
                            parseInt(active_rect.attr('x')),
                            parseInt(active_rect.attr('y')),
                            parseInt(active_rect.attr('width')),
                            parseInt(active_rect.attr('height'))
                        ]
                    });
                }
                break;
            case 2:
                var active_polygon = canvas.select('polygon.active');
                if (active_polygon.empty()) {
                    canvas.append('polygon').classed('active', true).attrs({'points': coords.join(','), 'stroke-width': '1', 'stroke': '#F66', 'fill': 'rgba(239, 108, 0, 0.5)'});
                } else {
                    active_polygon.attr('points', active_polygon.attr('points') + ' ' + coords.join(','));
                }
                break;
            default:

        }

    });

    canvas.on('mousemove', function() {
        var coords = d3.mouse(this);
        switch (modebit) {
            case 1:
                var active_rect = canvas.select('rect.active');
                if (!active_rect.empty()) {
                    var rect_w = Math.abs(coords[0] - active_rect.attr('x0'));
                    var rect_h = Math.abs(coords[1] - active_rect.attr('y0'));
                    if (coords[0] < active_rect.attr('x0')) {
                        active_rect.attr('x', coords[0]);
                    } else {
                        active_rect.attr('x', active_rect.attr('x0'));
                    }
                    if (coords[1] < active_rect.attr('y0')) {
                        active_rect.attr('y', coords[1]);
                    } else {
                        active_rect.attr('y', active_rect.attr('y0'));
                    }
                    active_rect.attr('width', rect_w).attr('height', rect_h);
                }
                break;
            case 2:
                var active_polygon = canvas.select('polygon.active');
                if (!active_polygon.empty()) {
                    active_polygon.attr('points', active_polygon.attr('points').replace(/\s+\d+,\d+$/, '') + ' ' + coords.join(','));
                }
                break;
            default:

        }
    });

    canvas.on('dblclick', function() {
        var coords = d3.mouse(this);

        switch (modebit) {
            case 2:
                var active_polygon = canvas.select('polygon.active');
                if (!active_polygon.empty()) {
                    active_polygon.attr('points', active_polygon.attr('points') + ' ' + coords.join(','));
                    // polygon created and stored
                    confirmNewShape(active_polygon);
                    objects.push({
                        type: 'polygon',
                        id: 'canvas-e' + objects.length,
                        data: active_polygon.attr('points').split(' ').map(function(p) {
                            return [
                                parseInt(p.split(',')[0]),
                                parseInt(p.split(',')[1])
                            ];
                        })
                    });
                }
                break;
            default:

        }
    });
}

function confirmNewShape(shape) {
    shape.classed('active', false);
    shape.attrs({'stroke': '#F66', 'fill': 'rgba(38, 50, 56, 0.5)'});
    objects_redo = [];
    shape.attr('object_id', objects.length);
    shape.attr('id', 'canvas-e' + objects.length);
    shape.attr('rows', 0);
    shape.attr('rotation', 0);
    shape.attr('oversize', 0);
    shape.attr('startClass', '');
    shape.attr('startSubclass', 0);
    shape.attr('endClass', '');
    shape.attr('endSubclass', 0);
    addMarkHandlerToShape(shape);
    switch (modebit) {
        case 1:
            selectRect(shape.attr('object_id'));
            break;
        case 2:
            selectPolygon(shape.attr('object_id'));
            break;
        default:

    }
    modebit = 0;
}

function selectRect(id) {
    $('svg .selected').removeClass('selected');
    $('#canvas-e' + id).addClass('selected');
    $('#crect-x').val($('#canvas-e' + id).attr('x'));
    $('#crect-y').val($('#canvas-e' + id).attr('y'));
    $('#crect-width').val($('#canvas-e' + id).attr('width'));
    $('#crect-height').val($('#canvas-e' + id).attr('height'));
    $('.tool-options > .row').hide();
    $('.tool-options > .row:nth-child(1)').show();
    Materialize.updateTextFields();
}

function selectPolygon(id) {
    $('svg .selected').removeClass('selected');
    $('#canvas-e' + id).addClass('selected');
    $('#cpolygon-points').val($('#canvas-e' + id).attr('points'));
    $('.tool-options > .row').hide();
    $('.tool-options > .row:nth-child(2)').show();
    Materialize.updateTextFields();
}

function addMarkHandlerToShape(e) {
    e.on('click', function() {
        switch (modebit) {
            case 0:
                switch (objects[$(this).attr('object_id')].type) {
                    case 'rect':
                        selectRect(e.attr('object_id'));
                        break;
                    case 'polygon':
                        selectPolygon(e.attr('object_id'));
                        break;
                    default:

                }
                break;
            case 3:
                $('svg .selected').removeClass('selected');
                $(this).addClass('selected');
                $('#cmark-rows').val($(this).attr('rows'));
                $('#cmark-rotation').val($(this).attr('rotation'));
                $('#cmark-oversize').val($(this).attr('oversize'));
                $('#cmark-startClass').val($(this).attr('startClass'));
                $('#cmark-startSubclass').val($(this).attr('startSubclass'));
                $('#cmark-endClass').val($(this).attr('endClass'));
                $('#cmark-endSubclass').val($(this).attr('endSubclass'));
                Materialize.updateTextFields();
                break;
            default:

        }
    });
}
