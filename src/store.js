import { configureStore } from '@reduxjs/toolkit'
import MenuReducer from '@/slice/menuSlice'
import ToolboxReducer from '@/slice/toolboxSlice'
import PresenceReducer from '@/slice/presenceSlice'

export const store = configureStore({
    reducer: {
        menu: MenuReducer,
        toolbox: ToolboxReducer,
        presence: PresenceReducer
    }
})
