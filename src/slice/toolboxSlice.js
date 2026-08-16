import { createSlice } from '@reduxjs/toolkit'
import { MENU_ITEMS, COLORS } from '@/constants'

const initialState = {
    [MENU_ITEMS.PENCIL]: {
        color: COLORS.BLACK,
        size: 3
    },
    [MENU_ITEMS.ERASER]: {
        color: COLORS.WHITE,
        size: 3
    },
    [MENU_ITEMS.LINE]: {
        color: COLORS.BLACK,
        size: 3
    },
    [MENU_ITEMS.RECTANGLE]: {
        color: COLORS.BLACK,
        size: 3,
        fill: false
    },
    [MENU_ITEMS.CIRCLE]: {
        color: COLORS.BLACK,
        size: 3,
        fill: false
    },
    [MENU_ITEMS.TEXT]: {
        color: COLORS.BLACK,
        size: 3
    },
    [MENU_ITEMS.FILL]: {
        color: COLORS.BLACK
    },
    [MENU_ITEMS.UNDO]: {},
    [MENU_ITEMS.REDO]: {},
    [MENU_ITEMS.DOWNLOAD]: {},
    [MENU_ITEMS.CLEAR]: {},
    [MENU_ITEMS.SHARE]: {},
}

export const toolboxSlice = createSlice({
    name: 'toolbox',
    initialState,
    reducers: {
        changeColor: (state, action) => {
            state[action.payload.item].color = action.payload.color
        },
        changeBrushSize: (state, action) => {
            state[action.payload.item].size = action.payload.size
        },
        toggleFill: (state, action) => {
            state[action.payload.item].fill = action.payload.fill
        }
    }
})

export const {changeColor, changeBrushSize, toggleFill} = toolboxSlice.actions

export default toolboxSlice.reducer
