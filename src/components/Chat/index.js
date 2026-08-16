import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComments, faXmark, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import cx from 'classnames'

import { socket } from '@/socket'
import styles from './index.module.css'

const Chat = ({ selfName }) => {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [draft, setDraft] = useState('')
    const [unread, setUnread] = useState(0)
    const listRef = useRef(null)
    const openRef = useRef(open)
    useEffect(() => { openRef.current = open }, [open])

    // Ask for OS notification permission once, up front - the browser will
    // silently ignore this if the user already answered before.
    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return
        if (Notification.permission === 'default') Notification.requestPermission()
    }, [])

    useEffect(() => {
        const handleHistory = (history) => setMessages(history)
        const handleMessage = (message) => {
            setMessages((prev) => [...prev, message])

            const isSelf = message.name === selfName
            const isUnseen = !openRef.current || document.hidden
            if (!isSelf && isUnseen) {
                setUnread((prev) => prev + 1)

                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    const notification = new Notification(`${message.name} says:`, {
                        body: message.text,
                        tag: 'sketchbook-chat', // collapses rapid-fire messages into one OS notification
                    })
                    notification.onclick = () => {
                        window.focus()
                        setOpen(true)
                    }
                }
            }
        }

        socket.on('chatHistory', handleHistory)
        socket.on('chatMessage', handleMessage)

        return () => {
            socket.off('chatHistory', handleHistory)
            socket.off('chatMessage', handleMessage)
        }
    }, [selfName])

    // Mark everything read when the panel is opened, and again if the tab
    // regains focus while it's already open (messages that arrived while
    // backgrounded shouldn't stay "unread" forever).
    useEffect(() => {
        if (!open) return
        setUnread(0)
        const handleVisibility = () => { if (!document.hidden) setUnread(0) }
        document.addEventListener('visibilitychange', handleVisibility)
        return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [open])

    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }, [messages, open])

    const sendMessage = (e) => {
        e.preventDefault()
        const text = draft.trim()
        if (!text) return
        socket.emit('chatMessage', { text })
        setDraft('')
    }

    return (
        <>
            <div className={styles.toggle} onClick={() => setOpen((v) => !v)} title="Chat">
                <FontAwesomeIcon icon={open ? faXmark : faComments} className={styles.toggleIcon} />
                {!open && unread > 0 && <div className={styles.unreadBadge}>{unread}</div>}
            </div>
            {open && (
                <div className={styles.panel}>
                    <div className={styles.header}>Room chat</div>
                    <div className={styles.messages} ref={listRef}>
                        {messages.length === 0 && <div className={styles.empty}>No messages yet - say hi!</div>}
                        {messages.map((m) => (
                            <div key={m.id} className={styles.message}>
                                <span className={styles.author} style={{ color: m.color }}>
                                    {m.name === selfName ? `${m.name} (you)` : m.name}
                                </span>
                                <span className={styles.text}>{m.text}</span>
                            </div>
                        ))}
                    </div>
                    <form className={styles.inputRow} onSubmit={sendMessage}>
                        <input
                            className={styles.input}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Type a message..."
                            maxLength={500}
                        />
                        <button className={cx(styles.sendButton)} type="submit" disabled={!draft.trim()}>
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </form>
                </div>
            )}
        </>
    )
}

export default Chat
