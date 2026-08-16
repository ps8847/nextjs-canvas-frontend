import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faPencil, faEraser, faRotateLeft, faRotateRight, faFileArrowDown,
    faSquare, faCircle, faMinus, faFont, faFillDrip, faTrashCan, faShareNodes, faCheck
} from '@fortawesome/free-solid-svg-icons'

import styles from './index.module.css'

import { menuItemClick, actionItemClick } from '@/slice/menuSlice'

import { MENU_ITEMS } from '@/constants'

const Menu = () => {
    const dispatch = useDispatch()
    const [copied, setCopied] = useState(false)
    const activeMenuItem = useSelector((state) => state.menu.activeMenuItem)
    const users = useSelector((state) => state.presence?.users) || []

    const handleMenuClick = (itemName) => {
        dispatch(menuItemClick(itemName))
    }

    const handleActioItemClick = (itemName) => {
        dispatch(actionItemClick(itemName))
    }

    const handleShareClick = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
        } catch (e) {
            // clipboard API can fail (e.g. insecure context) - link is still visible in the address bar
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div className={styles.menuContainer}>
            <div className={cx(styles.iconWrapper, {[styles.active]: activeMenuItem === MENU_ITEMS.PENCIL})} onClick={() => handleMenuClick(MENU_ITEMS.PENCIL)} title="Pencil">
                <FontAwesomeIcon icon={faPencil} className={styles.icon} />
            </div>
            <div className={cx(styles.iconWrapper, {[styles.active]: activeMenuItem === MENU_ITEMS.ERASER})} onClick={() => handleMenuClick(MENU_ITEMS.ERASER)} title="Eraser">
                <FontAwesomeIcon icon={faEraser} className={styles.icon} />
            </div>
            <div className={cx(styles.iconWrapper, {[styles.active]: activeMenuItem === MENU_ITEMS.LINE})} onClick={() => handleMenuClick(MENU_ITEMS.LINE)} title="Line">
                <FontAwesomeIcon icon={faMinus} className={styles.icon} />
            </div>
            <div className={cx(styles.iconWrapper, {[styles.active]: activeMenuItem === MENU_ITEMS.RECTANGLE})} onClick={() => handleMenuClick(MENU_ITEMS.RECTANGLE)} title="Rectangle">
                <FontAwesomeIcon icon={faSquare} className={styles.icon} />
            </div>
            <div className={cx(styles.iconWrapper, {[styles.active]: activeMenuItem === MENU_ITEMS.CIRCLE})} onClick={() => handleMenuClick(MENU_ITEMS.CIRCLE)} title="Circle">
                <FontAwesomeIcon icon={faCircle} className={styles.icon} />
            </div>
            <div className={cx(styles.iconWrapper, {[styles.active]: activeMenuItem === MENU_ITEMS.TEXT})} onClick={() => handleMenuClick(MENU_ITEMS.TEXT)} title="Text">
                <FontAwesomeIcon icon={faFont} className={styles.icon} />
            </div>
            <div className={cx(styles.iconWrapper, {[styles.active]: activeMenuItem === MENU_ITEMS.FILL})} onClick={() => handleMenuClick(MENU_ITEMS.FILL)} title="Fill">
                <FontAwesomeIcon icon={faFillDrip} className={styles.icon} />
            </div>
            <div className={styles.iconWrapper} onClick={() => handleActioItemClick(MENU_ITEMS.UNDO)} title="Undo">
                <FontAwesomeIcon icon={faRotateLeft} className={styles.icon}/>
            </div>
            <div className={styles.iconWrapper} onClick={() => handleActioItemClick(MENU_ITEMS.REDO)} title="Redo">
                <FontAwesomeIcon icon={faRotateRight} className={styles.icon}/>
            </div>
            <div className={styles.iconWrapper} onClick={() => handleActioItemClick(MENU_ITEMS.CLEAR)} title="Clear canvas">
                <FontAwesomeIcon icon={faTrashCan} className={styles.icon}/>
            </div>
            <div className={styles.iconWrapper}  onClick={() => handleActioItemClick(MENU_ITEMS.DOWNLOAD)} title="Download">
                <FontAwesomeIcon icon={faFileArrowDown} className={styles.icon}/>
            </div>
            <div className={styles.iconWrapper} onClick={handleShareClick} title="Copy share link">
                <FontAwesomeIcon icon={copied ? faCheck : faShareNodes} className={styles.icon}/>
            </div>
            {users.length > 0 && <div className={styles.userBadge} title={users.map(u => u.name).join(', ')}>
                {users.length}
            </div>}
        </div>
    )
}

export default Menu;
