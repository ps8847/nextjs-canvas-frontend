import { useSelector, useDispatch } from 'react-redux'
import cx from 'classnames';

import styles from './index.module.css'

import { COLORS, MENU_ITEMS, DRAWING_ITEMS, FILLABLE_ITEMS } from '@/constants'
import {changeColor, changeBrushSize, toggleFill } from '@/slice/toolboxSlice'
import { socket } from "@/socket";

const Toolbox = () => {
    const dispatch = useDispatch()
    const activeMenuItem = useSelector((state) => state.menu.activeMenuItem)
    const showStrokeToolOption = DRAWING_ITEMS.includes(activeMenuItem) || activeMenuItem === MENU_ITEMS.FILL
    const showBrushToolOption = DRAWING_ITEMS.includes(activeMenuItem)
    const showFillToolOption = FILLABLE_ITEMS.includes(activeMenuItem)
    const toolState = useSelector((state) => state.toolbox[activeMenuItem])
    const {color, size, fill} = toolState || {}

    const updateBrushSize = (e) => {
        dispatch(changeBrushSize({item: activeMenuItem, size: e.target.value}))
        socket.emit('changeConfig', {color, size: e.target.value })
    }

    const updateColor = (newColor) => {
        dispatch(changeColor({item: activeMenuItem, color: newColor}))
        socket.emit('changeConfig', {color: newColor, size })
    }

    const updateFill = (newFill) => {
        dispatch(toggleFill({item: activeMenuItem, fill: newFill}))
    }

    return (<div className={styles.toolboxContainer}>
        {showStrokeToolOption && <div className={styles.toolItem}>
            <h4 className={styles.toolText}>Stroke Color</h4>
            <div className={styles.itemContainer}>
                <div className={cx(styles.colorBox, {[styles.active]: color === COLORS.BLACK})} style={{backgroundColor: COLORS.BLACK}} onClick={() => updateColor(COLORS.BLACK)}/>
                <div className={cx(styles.colorBox, {[styles.active]: color === COLORS.RED})} style={{backgroundColor: COLORS.RED}} onClick={() => updateColor(COLORS.RED)}/>
                <div className={cx(styles.colorBox, {[styles.active]: color === COLORS.GREEN})} style={{backgroundColor: COLORS.GREEN}} onClick={() => updateColor(COLORS.GREEN)}/>
                <div className={cx(styles.colorBox, {[styles.active]: color === COLORS.BLUE})} style={{backgroundColor: COLORS.BLUE}} onClick={() => updateColor(COLORS.BLUE)}/>
                <div className={cx(styles.colorBox, {[styles.active]: color === COLORS.ORANGE})} style={{backgroundColor: COLORS.ORANGE}} onClick={() => updateColor(COLORS.ORANGE)}/>
                <div className={cx(styles.colorBox, {[styles.active]: color === COLORS.YELLOW})} style={{backgroundColor: COLORS.YELLOW}} onClick={() => updateColor(COLORS.YELLOW)}/>
            </div>
        </div>}
        {showBrushToolOption && <div className={styles.toolItem}>
            <h4 className={styles.toolText}>{activeMenuItem === MENU_ITEMS.TEXT ? 'Font Size' : 'Brush Size'}</h4>
            <div className={styles.itemContainer}>
                <input type="range" min={1} max={10} step={1} onChange={updateBrushSize} value={size}/>
            </div>
        </div>}
        {showFillToolOption && <div className={styles.toolItem}>
            <h4 className={styles.toolText}>Fill Shape</h4>
            <div className={styles.itemContainer}>
                <input type="checkbox" checked={!!fill} onChange={(e) => updateFill(e.target.checked)}/>
            </div>
        </div>}
    </div>)
}

export default Toolbox;
