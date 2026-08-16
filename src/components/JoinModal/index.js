import { useState } from 'react'
import styles from './index.module.css'

const JoinModal = ({ onJoin }) => {
    const [name, setName] = useState('')

    const submit = (e) => {
        e.preventDefault()
        const trimmed = name.trim()
        if (!trimmed) return
        onJoin(trimmed.slice(0, 24))
    }

    return (
        <div className={styles.overlay}>
            <form className={styles.card} onSubmit={submit}>
                <h2 className={styles.title}>Join the board</h2>
                <p className={styles.subtitle}>Pick a display name so others can see who&apos;s drawing.</p>
                <input
                    className={styles.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                    maxLength={24}
                />
                <button className={styles.button} type="submit" disabled={!name.trim()}>Join</button>
            </form>
        </div>
    )
}

export default JoinModal
