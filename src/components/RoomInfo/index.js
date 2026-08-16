import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faPen, faUsers } from '@fortawesome/free-solid-svg-icons'
import { useSelector } from 'react-redux'

import styles from './index.module.css'

const RoomInfo = ({ roomId, userName, userColor, onRename }) => {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(userName)
    const [copied, setCopied] = useState(false)
    const users = useSelector((state) => state.presence.users)

    const submitRename = (e) => {
        e.preventDefault()
        const trimmed = draft.trim()
        if (trimmed) onRename(trimmed.slice(0, 24))
        setEditing(false)
    }

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId)
        } catch (e) {
            // clipboard API can fail in insecure contexts - id is still visible in the badge
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
    }

    return (
        <div className={styles.container}>
            <div className={styles.roomBadge} onClick={copyRoomId} title="Click to copy room ID">
                Room: <span className={styles.roomId}>{roomId}</span>
                {copied && <span className={styles.copiedHint}>copied!</span>}
            </div>
            <div className={styles.usersBadge} title={[userName, ...users.map((u) => u.name)].join(', ')}>
                <FontAwesomeIcon icon={faUsers} className={styles.usersIcon} />
                {users.length + 1}
            </div>
            {editing ? (
                <form className={styles.nameForm} onSubmit={submitRename}>
                    <input
                        className={styles.nameInput}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={24}
                        autoFocus
                        onBlur={submitRename}
                    />
                    <button type="submit" className={styles.nameIconButton}><FontAwesomeIcon icon={faCheck} /></button>
                </form>
            ) : (
                <div className={styles.youBadge} onClick={() => { setDraft(userName); setEditing(true) }} title="Click to change your name">
                    <span className={styles.youDot} style={{ backgroundColor: userColor }} />
                    You: {userName}
                    <FontAwesomeIcon icon={faPen} className={styles.editIcon} />
                </div>
            )}
        </div>
    )
}

export default RoomInfo
