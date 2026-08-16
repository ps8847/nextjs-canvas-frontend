import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from 'react-redux'

import {
    MENU_ITEMS, FREEHAND_ITEMS, SHAPE_ITEMS, CURSOR_COLORS,
    WORLD_WIDTH, WORLD_HEIGHT, MIN_ZOOM, MAX_ZOOM
} from "@/constants";
import { actionItemClick } from '@/slice/menuSlice'
import { setUsers, setCursor, removeCursor } from '@/slice/presenceSlice'

import { socket } from "@/socket";

import styles from './index.module.css'

// Draws a committed (or previewed) shape op onto a given context.
const renderShape = (context, { tool, x0, y0, x1, y1, color, size, fill }) => {
    context.strokeStyle = color
    context.fillStyle = color
    context.lineWidth = size

    if (tool === MENU_ITEMS.LINE) {
        context.beginPath()
        context.moveTo(x0, y0)
        context.lineTo(x1, y1)
        context.stroke()
    } else if (tool === MENU_ITEMS.RECTANGLE) {
        const w = x1 - x0
        const h = y1 - y0
        fill ? context.fillRect(x0, y0, w, h) : context.strokeRect(x0, y0, w, h)
    } else if (tool === MENU_ITEMS.CIRCLE) {
        const cx = (x0 + x1) / 2
        const cy = (y0 + y1) / 2
        const rx = Math.abs(x1 - x0) / 2
        const ry = Math.abs(y1 - y0) / 2
        context.beginPath()
        context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        fill ? context.fill() : context.stroke()
    }
}

const renderText = (context, { x, y, text, color, size }) => {
    context.fillStyle = color
    context.font = `${(size || 3) * 6 + 10}px sans-serif`
    context.fillText(text, x, y)
}

const renderStroke = (context, { points, color, size }) => {
    if (!points || points.length === 0) return
    context.strokeStyle = color
    context.lineWidth = size
    context.beginPath()
    context.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach((p) => context.lineTo(p.x, p.y))
    context.stroke()
}

// Resolves any CSS color string (name, hex, rgb...) to an [r,g,b,a] tuple by
// painting it onto a throwaway 1x1 canvas and reading the pixel back.
let swatchCtx = null
const resolveColor = (cssColor) => {
    if (!swatchCtx) {
        const c = document.createElement('canvas')
        c.width = 1
        c.height = 1
        swatchCtx = c.getContext('2d', { willReadFrequently: true })
    }
    swatchCtx.clearRect(0, 0, 1, 1)
    swatchCtx.fillStyle = cssColor
    swatchCtx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = swatchCtx.getImageData(0, 0, 1, 1).data
    return [r, g, b, a]
}

const colorsMatch = (a, b, tolerance) =>
    Math.abs(a[0] - b[0]) <= tolerance &&
    Math.abs(a[1] - b[1]) <= tolerance &&
    Math.abs(a[2] - b[2]) <= tolerance &&
    Math.abs(a[3] - b[3]) <= tolerance

// Stack-based flood fill over the full world-space raster, so the filled
// region is identical for every client regardless of their own zoom/pan.
const floodFill = (context, startX, startY, fillColor) => {
    const x0 = Math.floor(startX)
    const y0 = Math.floor(startY)
    if (x0 < 0 || y0 < 0 || x0 >= WORLD_WIDTH || y0 >= WORLD_HEIGHT) return

    const imageData = context.getImageData(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    const data = imageData.data
    const target = resolveColor(fillColor)

    const startIdx = (y0 * WORLD_WIDTH + x0) * 4
    const startColor = [data[startIdx], data[startIdx + 1], data[startIdx + 2], data[startIdx + 3]]
    if (colorsMatch(startColor, target, 0)) return

    const tolerance = 32
    const visited = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT)
    const stack = [[x0, y0]]

    while (stack.length) {
        const [cx, cy] = stack.pop()
        if (cx < 0 || cy < 0 || cx >= WORLD_WIDTH || cy >= WORLD_HEIGHT) continue
        const idx = cy * WORLD_WIDTH + cx
        if (visited[idx]) continue

        const off = idx * 4
        if (!colorsMatch([data[off], data[off + 1], data[off + 2], data[off + 3]], startColor, tolerance)) continue

        visited[idx] = 1
        data[off] = target[0]
        data[off + 1] = target[1]
        data[off + 2] = target[2]
        data[off + 3] = 255

        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
    }

    context.putImageData(imageData, 0, 0)
}

const replayOp = (context, op) => {
    if (op.type === 'stroke') renderStroke(context, op)
    else if (op.type === 'shape') renderShape(context, op)
    else if (op.type === 'text') renderText(context, op)
    else if (op.type === 'fill') floodFill(context, op.x, op.y, op.color)
}

const Board = ({ roomId, userName, userColor }) => {
    const dispatch = useDispatch()
    const boardRef = useRef(null)
    const canvasRef = useRef(null)
    const previewCanvasRef = useRef(null)
    const eraserCursorRef = useRef(null)
    const drawHistory = useRef([])
    const historyPointer = useRef(0)
    const shouldDraw = useRef(false)
    const shapeStart = useRef(null)
    const currentPoints = useRef([])
    const lastCursorEmit = useRef(0)
    const spacePressed = useRef(false)
    const isPanning = useRef(false)
    const panStart = useRef(null)

    const userRef = useRef(null)
    if (!userRef.current) {
        userRef.current = {
            name: userName || `Guest-${Math.floor(Math.random() * 1000)}`,
            color: userColor || CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]
        }
    }

    const [selfId, setSelfId] = useState(null)
    const [view, setView] = useState({ scale: 1, panX: 0, panY: 0 })
    const viewRef = useRef(view)
    useEffect(() => { viewRef.current = view }, [view])

    const { activeMenuItem, actionMenuItem } = useSelector((state) => state.menu)
    const toolState = useSelector((state) => state.toolbox[activeMenuItem]) || {}
    const { color, size, fill } = toolState
    const cursors = useSelector((state) => state.presence.cursors)

    // Keep pointer handlers (bound once) reading up-to-date tool config via a ref.
    const toolRef = useRef({ activeMenuItem, color, size, fill })
    useEffect(() => {
        toolRef.current = { activeMenuItem, color, size, fill }
    }, [activeMenuItem, color, size, fill])

    // Join the room and wire up presence + history replay.
    useEffect(() => {
        if (!roomId || !canvasRef.current) return
        const context = canvasRef.current.getContext('2d', { willReadFrequently: true })

        socket.connect()
        socket.emit('joinRoom', { roomId, name: userRef.current.name, color: userRef.current.color })
        setSelfId(socket.id)
        socket.on('connect', () => setSelfId(socket.id))

        const handleCanvasState = (history) => {
            history.forEach((op) => replayOp(context, op))
            const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
            drawHistory.current = [imageData]
            historyPointer.current = 0
        }

        const handleRoomUsers = (users) => {
            dispatch(setUsers(users.filter((u) => u.id !== socket.id)))
        }

        const handleUserLeft = ({ id }) => {
            dispatch(removeCursor({ id }))
        }

        const handleCursorMove = (payload) => {
            dispatch(setCursor(payload))
        }

        const handleClearCanvas = () => {
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }

        const handleRemoteFloodFill = ({ x, y, color }) => {
            floodFill(context, x, y, color)
        }

        socket.on('canvasState', handleCanvasState)
        socket.on('roomUsers', handleRoomUsers)
        socket.on('userLeft', handleUserLeft)
        socket.on('cursorMove', handleCursorMove)
        socket.on('clearCanvas', handleClearCanvas)
        socket.on('floodFill', handleRemoteFloodFill)

        return () => {
            socket.off('canvasState', handleCanvasState)
            socket.off('roomUsers', handleRoomUsers)
            socket.off('userLeft', handleUserLeft)
            socket.off('cursorMove', handleCursorMove)
            socket.off('clearCanvas', handleClearCanvas)
            socket.off('floodFill', handleRemoteFloodFill)
            socket.disconnect()
        }
    }, [roomId, dispatch])

    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')

        if (actionMenuItem === MENU_ITEMS.DOWNLOAD) {
            const URL = canvas.toDataURL()
            const anchor = document.createElement('a')
            anchor.href = URL
            anchor.download = 'sketch.jpg'
            anchor.click()
        } else if (actionMenuItem === MENU_ITEMS.UNDO || actionMenuItem === MENU_ITEMS.REDO) {
            if (historyPointer.current > 0 && actionMenuItem === MENU_ITEMS.UNDO) historyPointer.current -= 1
            if (historyPointer.current < drawHistory.current.length - 1 && actionMenuItem === MENU_ITEMS.REDO) historyPointer.current += 1
            const imageData = drawHistory.current[historyPointer.current]
            if (imageData) context.putImageData(imageData, 0, 0)
        } else if (actionMenuItem === MENU_ITEMS.CLEAR) {
            context.clearRect(0, 0, canvas.width, canvas.height)
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            drawHistory.current.push(imageData)
            historyPointer.current = drawHistory.current.length - 1
            socket.emit('clearCanvas')
        }
        dispatch(actionItemClick(null))
    }, [actionMenuItem, dispatch])

    useEffect(() => {
        if (!canvasRef.current || color === undefined) return
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')

        const changeConfig = (color, size) => {
            context.strokeStyle = color
            context.lineWidth = size
        }

        const handleChangeConfig = (config) => {
            changeConfig(config.color, config.size)
        }
        changeConfig(color, size)
        socket.on('changeConfig', handleChangeConfig)

        return () => {
            socket.off('changeConfig', handleChangeConfig)
        }
    }, [color, size])

    // before browser pain
    useLayoutEffect(() => {
        if (!canvasRef.current || !previewCanvasRef.current || !boardRef.current) return
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true })
        const previewCanvas = previewCanvasRef.current
        const previewContext = previewCanvas.getContext('2d')
        const board = boardRef.current

        // Screen (viewport) coordinates -> world (canvas-buffer) coordinates,
        // accounting for the current pan/zoom.
        const toWorld = (clientX, clientY) => {
            const { scale, panX, panY } = viewRef.current
            return { x: (clientX - panX) / scale, y: (clientY - panY) / scale }
        }

        const getClientPos = (e) => ({
            x: e.clientX ?? e.touches[0].clientX,
            y: e.clientY ?? e.touches[0].clientY
        })

        const beginPath = (x, y) => {
            context.beginPath()
            context.moveTo(x, y)
        }

        const drawLine = (x, y) => {
            context.lineTo(x, y)
            context.stroke()
        }

        const commit = (op) => {
            drawHistory.current = drawHistory.current.slice(0, historyPointer.current + 1)
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            drawHistory.current.push(imageData)
            historyPointer.current = drawHistory.current.length - 1
            socket.emit('commitOp', op)
        }

        const updateEraserPreview = (clientX, clientY, active) => {
            const el = eraserCursorRef.current
            if (!el) return
            if (!active) {
                el.style.display = 'none'
                return
            }
            const { scale } = viewRef.current
            const diameter = Math.max((toolRef.current.size || 3) * scale * 2, 6)
            el.style.display = 'block'
            el.style.width = `${diameter}px`
            el.style.height = `${diameter}px`
            el.style.left = `${clientX - diameter / 2}px`
            el.style.top = `${clientY - diameter / 2}px`
        }

        const startPan = (clientX, clientY) => {
            isPanning.current = true
            panStart.current = { x: clientX, y: clientY, panX: viewRef.current.panX, panY: viewRef.current.panY }
        }

        const handleMouseDown = (e) => {
            const client = getClientPos(e)

            if (e.button === 1 || (e.button === 0 && spacePressed.current)) {
                e.preventDefault()
                startPan(client.x, client.y)
                return
            }
            if (e.button !== undefined && e.button !== 0) return

            const { x, y } = toWorld(client.x, client.y)
            const tool = toolRef.current.activeMenuItem

            if (FREEHAND_ITEMS.includes(tool)) {
                shouldDraw.current = true
                currentPoints.current = [{ x, y }]
                beginPath(x, y)
                socket.emit('beginPath', { x, y })
            } else if (SHAPE_ITEMS.includes(tool)) {
                shouldDraw.current = true
                shapeStart.current = { x, y }
            } else if (tool === MENU_ITEMS.TEXT) {
                const text = window.prompt('Enter text')
                if (text) {
                    const { color, size } = toolRef.current
                    renderText(context, { x, y, text, color, size })
                    socket.emit('drawText', { x, y, text, color, size })
                    commit({ type: 'text', x, y, text, color, size })
                }
            } else if (tool === MENU_ITEMS.FILL) {
                const { color } = toolRef.current
                floodFill(context, x, y, color)
                socket.emit('floodFill', { x, y, color })
                commit({ type: 'fill', x, y, color })
            }
        }

        const handleMouseMove = (e) => {
            const client = getClientPos(e)

            if (isPanning.current) {
                const dx = client.x - panStart.current.x
                const dy = client.y - panStart.current.y
                setView({ scale: viewRef.current.scale, panX: panStart.current.panX + dx, panY: panStart.current.panY + dy })
                return
            }

            const now = Date.now()
            if (now - lastCursorEmit.current > 40) {
                lastCursorEmit.current = now
                socket.emit('cursorMove', { x: client.x, y: client.y, name: userRef.current.name, color: userRef.current.color })
            }

            const tool = toolRef.current.activeMenuItem
            updateEraserPreview(client.x, client.y, tool === MENU_ITEMS.ERASER)

            if (!shouldDraw.current) return
            const { x, y } = toWorld(client.x, client.y)

            if (FREEHAND_ITEMS.includes(tool)) {
                currentPoints.current.push({ x, y })
                drawLine(x, y)
                socket.emit('drawLine', { x, y })
            } else if (SHAPE_ITEMS.includes(tool) && shapeStart.current) {
                const { color, size, fill } = toolRef.current
                previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
                renderShape(previewContext, { tool, x0: shapeStart.current.x, y0: shapeStart.current.y, x1: x, y1: y, color, size, fill })
            }
        }

        const handleMouseUp = (e) => {
            if (isPanning.current) {
                isPanning.current = false
                return
            }
            if (!shouldDraw.current) return
            shouldDraw.current = false
            const tool = toolRef.current.activeMenuItem

            if (FREEHAND_ITEMS.includes(tool)) {
                const { color, size } = toolRef.current
                commit({ type: 'stroke', points: currentPoints.current, color, size })
                currentPoints.current = []
            } else if (SHAPE_ITEMS.includes(tool) && shapeStart.current) {
                const client = getClientPos(e)
                const { x, y } = toWorld(client.x, client.y)
                const { color, size, fill } = toolRef.current
                const shape = { tool, x0: shapeStart.current.x, y0: shapeStart.current.y, x1: x, y1: y, color, size, fill }
                previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
                renderShape(context, shape)
                socket.emit('drawShape', shape)
                commit({ type: 'shape', ...shape })
                shapeStart.current = null
            }
        }

        const handleMouseLeave = () => updateEraserPreview(0, 0, false)

        const handleWheel = (e) => {
            e.preventDefault()
            const { scale, panX, panY } = viewRef.current
            const zoomFactor = Math.exp(-e.deltaY * 0.001)
            const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale * zoomFactor))
            const worldX = (e.clientX - panX) / scale
            const worldY = (e.clientY - panY) / scale
            setView({ scale: newScale, panX: e.clientX - worldX * newScale, panY: e.clientY - worldY * newScale })
        }

        const handleKeyDown = (e) => {
            const tag = document.activeElement?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return
            if (e.code === 'Space') {
                spacePressed.current = true
                board.style.cursor = 'grab'
            }
        }

        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                spacePressed.current = false
                board.style.cursor = 'default'
            }
        }

        const handleBeginPath = (path) => beginPath(path.x, path.y)
        const handleDrawLine = (path) => drawLine(path.x, path.y)
        const handleDrawShape = (shape) => renderShape(context, shape)
        const handleDrawText = (textOp) => renderText(context, textOp)

        board.addEventListener('mousedown', handleMouseDown)
        board.addEventListener('mousemove', handleMouseMove)
        board.addEventListener('mouseup', handleMouseUp)
        board.addEventListener('mouseleave', handleMouseLeave)
        board.addEventListener('wheel', handleWheel, { passive: false })

        board.addEventListener('touchstart', handleMouseDown)
        board.addEventListener('touchmove', handleMouseMove)
        board.addEventListener('touchend', handleMouseUp)

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        socket.on('beginPath', handleBeginPath)
        socket.on('drawLine', handleDrawLine)
        socket.on('drawShape', handleDrawShape)
        socket.on('drawText', handleDrawText)

        return () => {
            board.removeEventListener('mousedown', handleMouseDown)
            board.removeEventListener('mousemove', handleMouseMove)
            board.removeEventListener('mouseup', handleMouseUp)
            board.removeEventListener('mouseleave', handleMouseLeave)
            board.removeEventListener('wheel', handleWheel)

            board.removeEventListener('touchstart', handleMouseDown)
            board.removeEventListener('touchmove', handleMouseMove)
            board.removeEventListener('touchend', handleMouseUp)

            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)

            socket.off('beginPath', handleBeginPath)
            socket.off('drawLine', handleDrawLine)
            socket.off('drawShape', handleDrawShape)
            socket.off('drawText', handleDrawText)
        }

    }, [])

    const zoomBy = (factor) => {
        const { scale, panX, panY } = viewRef.current
        const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale * factor))
        const cx = window.innerWidth / 2
        const cy = window.innerHeight / 2
        const worldX = (cx - panX) / scale
        const worldY = (cy - panY) / scale
        setView({ scale: newScale, panX: cx - worldX * newScale, panY: cy - worldY * newScale })
    }

    const resetView = () => setView({ scale: 1, panX: 0, panY: 0 })

    const canvasStyle = {
        transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.scale})`,
        transformOrigin: '0 0'
    }

    return (
        <div className={styles.boardContainer} ref={boardRef}>
            <canvas ref={canvasRef} width={WORLD_WIDTH} height={WORLD_HEIGHT} className={styles.canvas} style={canvasStyle}></canvas>
            <canvas ref={previewCanvasRef} width={WORLD_WIDTH} height={WORLD_HEIGHT} className={styles.previewCanvas} style={canvasStyle}></canvas>
            <div ref={eraserCursorRef} className={styles.eraserCursor}></div>
            {Object.entries(cursors).map(([id, cursor]) => (
                id === selfId ? null : (
                    <div key={id} className={styles.cursor} style={{ left: cursor.x, top: cursor.y }}>
                        <div className={styles.cursorDot} style={{ backgroundColor: cursor.color }} />
                        <div className={styles.cursorLabel} style={{ backgroundColor: cursor.color }}>{cursor.name}</div>
                    </div>
                )
            ))}
            <div className={styles.zoomControls}>
                <button className={styles.zoomButton} onClick={() => zoomBy(0.8)} title="Zoom out">-</button>
                <button className={styles.zoomButton} onClick={resetView} title="Reset view">{Math.round(view.scale * 100)}%</button>
                <button className={styles.zoomButton} onClick={() => zoomBy(1.25)} title="Zoom in">+</button>
            </div>
        </div>
    )
}

export default Board;
