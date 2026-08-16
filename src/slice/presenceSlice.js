import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    users: [],   // [{id, name, color}] - other connected users in the room (excludes self)
    cursors: {}  // { [socketId]: {x, y, name, color} } - last known remote pointer position
}

export const presenceSlice = createSlice({
    name: 'presence',
    initialState,
    reducers: {
        setUsers: (state, action) => {
            state.users = action.payload
        },
        setCursor: (state, action) => {
            const {id, x, y, name, color} = action.payload
            state.cursors[id] = {x, y, name, color}
        },
        removeCursor: (state, action) => {
            delete state.cursors[action.payload.id]
        }
    }
})

export const {setUsers, setCursor, removeCursor} = presenceSlice.actions

export default presenceSlice.reducer
