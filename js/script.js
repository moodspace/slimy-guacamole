var libraries = [
    {
        id: 1,
        name: 'Kroch'
    }, {
        id: 2,
        name: 'Mann'
    }, {
        id: 3,
        name: 'Olin',
        floors: [
            {
                id: 1,
                name: '7'
            }, {
                id: 2,
                name: '6'
            }, {
                id: 3,
                name: '5'
            }, {
                id: 4,
                name: '4'
            }, {
                id: 5,
                name: '3'
            }, {
                id: 6,
                name: '2'
            }, {
                id: 7,
                name: '1'
            }, {
                id: 8,
                name: 'B1'
            }
        ]
    }, {
        id: 4,
        name: 'Uris',
        floors: []
    }
];

var current_library = 3;
var current_floor = 2;

$(document).ready(function() {
    libraries.forEach(function(lib) {
        var item = $('<a href="#!" class="collection-item">' + lib.name + '</a>').appendTo($('#library-collection'));
        if (lib.id === current_library) {
            item.addClass('active');
            lib.floors.forEach(function(floor) {
                var f_item = $('<a href="#!" class="collection-item">' + floor.name + '</a>').appendTo($('#floor-collection'));
                if (floor.id === current_floor) {
                    f_item.addClass('active');
                }
            });
        }
    });
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
            if (modebit === 1 || modebit === 2) {
                canvas.style('cursor', 'crosshair');
            } else {
                canvas.style('cursor', 'default');
            }
            $('.tool-options > .row').hide();
            $('.toolbox a.btn-flat').removeClass('light-blue');
            if (!$('svg.selected').empty) {
                $('.tool-options > .row:nth-child(' + index + ')').show();
            }
            $(this).addClass('light-blue');
        });
    });

    $('#viewmode-toggle').change(function() {
      if (this.checked) {
        $('svg g').removeClass('hidden');
      } else {
        $('svg g').removeClass('hidden');
        $('svg g').addClass('hidden');
      }
    });

    $('#nav-undo').click(function() {
        if (objects.length === 0) {
            return;
        }
        var obj = objects.pop();
        if (obj.type !== 'stacks') {
            $('#' + obj.id).remove();
        } else {
            canvas.select('g[for="' + obj.id + '"]').remove();
        }
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
                    'object_id': obj.id.replace('canvas-e-', ''),
                    'id': obj.id
                });
                // rect redrawn and restored
                objects.push(obj);
                addMarkHandlerToShape(rect);
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
                    'object_id': obj.id.replace('canvas-e-', ''),
                    'id': obj.id
                });
                // rect redrawn and restored
                objects.push(obj);
                addMarkHandlerToShape(polygon);
                break;
            case 'stacks':
                var group = canvas.append('g').attr('for', obj.id);
                obj.data.forEach(function(rect_data) {
                    var rect = group.append('rect').attrs({
                        'x': rect_data.x,
                        'y': rect_data.y,
                        'width': rect_data.width,
                        'height': rect_data.height,
                        'stroke-width': '1',
                        'stroke': '#0AC',
                        'fill': 'rgba(38, 50, 56, 0.5)'
                    });
                    rect.attr('transform', 'rotate(' + rect_data.rotation + ' ' + rect_data.gcent[0] + ' ' + rect_data.gcent[1] + ')');
                });
                // stacks redrawn and restored
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
        initStacksInShape(shape, $('#cmark-rows').val(), $('#cmark-rotation').val(), 0, {});
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
                    var rid = randomId();
                    objects.push({
                        type: 'rect',
                        id: 'canvas-e-' + rid,
                        data: [
                            parseInt(active_rect.attr('x')),
                            parseInt(active_rect.attr('y')),
                            parseInt(active_rect.attr('width')),
                            parseInt(active_rect.attr('height'))
                        ]
                    });
                    confirmNewShape(active_rect, rid);
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
                    active_polygon.attr('points', active_polygon.attr('points').replace(/\s+[-\d\.]+,[-\d\.]+$/, '') + ' ' + coords.join(','));
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
                    var newPoints = active_polygon.attr('points') + ' ' + coords.join(',');
                    newPoints = arrayToPoints(prunePoints(pointsToArray(newPoints)));
                    active_polygon.attr('points', newPoints);
                    // polygon created and stored
                    var rid = randomId();
                    objects.push({
                        type: 'polygon',
                        id: 'canvas-e-' + rid,
                        data: active_polygon.attr('points').split(' ').map(function(p) {
                            return [
                                parseInt(p.split(',')[0]),
                                parseInt(p.split(',')[1])
                            ];
                        })
                    });
                    confirmNewShape(active_polygon, rid);
                }
                break;
            default:

        }
    });
}

function pointsToArray(strPoints) {
    return strPoints.split(' ').map(function(p) {
        return [
            parseInt(p.split(',')[0]),
            parseInt(p.split(',')[1])
        ];
    });
}

function arrayToPoints(points) {
    return points.map(function(p) {
        return p[0] + ',' + p[1];
    }).join(' ');
}

function prunePoints(points) {
    var ret = [];
    var lastPoint = points[0];
    ret.push(lastPoint);
    points.unshift();
    points.forEach(function(p) {
        if (Math.abs(lastPoint[0] - p[0]) > 5 || Math.abs(lastPoint[1] - p[1]) > 5) {
            if (Math.abs(lastPoint[0] - p[0]) <= 5) {
                ret.push([lastPoint[0], p[1]]);
            } else if (Math.abs(lastPoint[1] - p[1]) <= 5) {
                ret.push([p[0], lastPoint[1]]);
            } else {
                ret.push(p);
            }
        }
        lastPoint = p;
    });
    return ret;
}

function confirmNewShape(shape, id) {
    shape.classed('active', false);
    shape.attrs({'stroke': '#F66', 'fill': 'rgba(38, 50, 56, 0.5)'});
    objects_redo = [];
    shape.attr('object_id', id);
    shape.attr('id', 'canvas-e-' + id);
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
    canvas.style('cursor', 'default');
}

function selectRect(id) {
    $('svg .selected').removeClass('selected');
    $('#canvas-e-' + id).addClass('selected');
    $('#crect-x').val($('#canvas-e-' + id).attr('x'));
    $('#crect-y').val($('#canvas-e-' + id).attr('y'));
    $('#crect-width').val($('#canvas-e-' + id).attr('width'));
    $('#crect-height').val($('#canvas-e-' + id).attr('height'));
    $('.tool-options > .row').hide();
    $('.tool-options > .row:nth-child(1)').show();
    Materialize.updateTextFields();
}

function selectPolygon(id) {
    $('svg .selected').removeClass('selected');
    $('#canvas-e-' + id).addClass('selected');
    $('#cpolygon-points').val($('#canvas-e-' + id).attr('points'));
    $('.tool-options > .row').hide();
    $('.tool-options > .row:nth-child(2)').show();
    Materialize.updateTextFields();
}

function showMarkTool(id) {
    $('svg .selected').removeClass('selected');
    $('#canvas-e-' + id).addClass('selected');
    $('#cmark-rows').val($('#canvas-e-' + id).attr('rows'));
    $('#cmark-rotation').val($('#canvas-e-' + id).attr('rotation'));
    $('.tool-options > .row:nth-child(' + modebit + ')').show();
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
                showMarkTool(e.attr('object_id'));
                break;
            default:

        }
    });
}

var row_thickness = 10;

function initStacksInShape(e, rows, rotation, oversize, classes) {
    canvas.select('g[for="' + e.attr('id') + '"]').remove();
    new_objects = [];
    objects.forEach(function(obj) {
        if (obj.type !== 'stacks' || obj.id !== e.attr('id')) {
            new_objects.push(obj);
        }
    });
    objects = new_objects;

    var polygon = pointsToArray(e.attr('points'));
    var stacks = [];
    var theta = Math.PI * rotation / 180;
    var gamma = Math.PI / 2 - theta;

    var centeroid = d3.polygonCentroid(polygon);
    var row_normal_ends = [centeroid.slice(), centeroid.slice()];
    var row_ends = [centeroid.slice(), centeroid.slice()];
    while (d3.polygonContains(polygon, row_normal_ends[1])) {
        row_normal_ends[1][0] += Math.cos(gamma);
        row_normal_ends[1][1] += Math.sin(gamma);
    }
    while (d3.polygonContains(polygon, row_normal_ends[0])) {
        row_normal_ends[0][0] -= Math.cos(gamma);
        row_normal_ends[0][1] -= Math.sin(gamma);
    }

    while (d3.polygonContains(polygon, row_ends[1])) {
        // rhs
        row_ends[1][0] += Math.cos(theta);
        row_ends[1][1] -= Math.sin(theta);
    }
    while (d3.polygonContains(polygon, row_ends[0])) {
        // lhs
        row_ends[0][0] -= Math.cos(gamma);
        row_ends[0][1] += Math.sin(gamma);
    }

    var centeroid_row_len = Math.sqrt(Math.pow(row_ends[0][0] - row_ends[1][0], 2) + Math.pow(row_ends[0][1] - row_ends[1][1], 2));

    var row_spacing = Math.sqrt(Math.pow(row_normal_ends[0][0] - row_normal_ends[1][0], 2) + Math.pow(row_normal_ends[0][1] - row_normal_ends[1][1], 2));
    row_spacing = row_spacing / rows - row_thickness;

    var rect_center = [
        centeroid[0], centeroid[1] - 0.5 * rows * row_thickness - 0.5 * (rows - 1) * row_spacing
    ];

    var group = canvas.append('g').attr('for', e.attr('id'));
    var data_stacks = [];
    for (var i = 0; i < rows; i++) {
        var rect = group.append('rect').attrs({
            'x': rect_center[0] - centeroid_row_len * 0.5,
            'y': rect_center[1] - row_thickness * 0.5,
            'width': centeroid_row_len,
            'height': row_thickness,
            'stroke-width': '1',
            'stroke': '#0AC',
            'fill': 'rgba(38, 50, 56, 0.5)'
        });

        rect_center[1] += (row_thickness + row_spacing);

        rect.attr('transform', 'rotate(' + rotation + ' ' + centeroid[0] + ' ' + centeroid[1] + ')');
        data_stacks.push({
            'x': rect.attr('x'),
            'y': rect.attr('y'),
            'width': rect.attr('width'),
            'height': rect.attr('height'),
            'gcent': centeroid,
            'meta': {
                'cx': 0,
                'cy': 0,
                'lx': 0,
                'ly': 0,
                'rotation': 0,
                'oversize': 0,
                'startClass': 0,
                'startSubclass': 0,
                'endClass': 0,
                'endSubclass': 0
            },
            'rotation': rotation
        });
    }

    // stacks created and stored
    objects.push({type: 'stacks', id: e.attr('id'), data: data_stacks});
}

function randomId() {
    return Math.ceil(Math.random() * 100) + '-' + Math.ceil(Math.random() * 100) + '-' + Math.ceil(Math.random() * 100);
}
