const COLORS = {
    BLACK: 'black',
    RED: 'red',
    GREEN: 'green',
    BLUE: 'blue',
    ORANGE: 'orange',
    YELLOW: 'yellow',
    WHITE: 'white'
}

const MENU_ITEMS = {
    PENCIL: 'PENCIL',
    ERASER: 'ERASER',
    LINE: 'LINE',
    RECTANGLE: 'RECTANGLE',
    CIRCLE: 'CIRCLE',
    TEXT: 'TEXT',
    FILL: 'FILL',
    UNDO: 'UNDO',
    REDO: 'REDO',
    DOWNLOAD: 'DOWNLOAD',
    CLEAR: 'CLEAR',
    SHARE: 'SHARE'
}

// Tools that draw freehand, point-by-point (main canvas, live streamed).
const FREEHAND_ITEMS = [MENU_ITEMS.PENCIL, MENU_ITEMS.ERASER]

// Tools that drag out a shape via a preview overlay, then commit once.
const SHAPE_ITEMS = [MENU_ITEMS.LINE, MENU_ITEMS.RECTANGLE, MENU_ITEMS.CIRCLE]

// Tools that use the toolbox's stroke color/size controls.
const DRAWING_ITEMS = [...FREEHAND_ITEMS, ...SHAPE_ITEMS, MENU_ITEMS.TEXT]

// Tools whose shape can optionally be filled instead of just outlined.
const FILLABLE_ITEMS = [MENU_ITEMS.RECTANGLE, MENU_ITEMS.CIRCLE]

const CURSOR_COLORS = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4db6ac', '#f06292']

// The canvas is a fixed-size "world" surface, panned/zoomed into view via a
// CSS transform, rather than being resized to the viewport. This keeps
// drawing coordinates (and therefore flood fill / undo raster snapshots)
// identical across every connected client regardless of their own zoom/pan.
const WORLD_WIDTH = 3000
const WORLD_HEIGHT = 1800
const MIN_ZOOM = 0.2
const MAX_ZOOM = 5

export {
    COLORS, MENU_ITEMS, FREEHAND_ITEMS, SHAPE_ITEMS, DRAWING_ITEMS, FILLABLE_ITEMS,
    CURSOR_COLORS, WORLD_WIDTH, WORLD_HEIGHT, MIN_ZOOM, MAX_ZOOM
}
