import { useState } from 'react'
import { useRouter } from 'next/router'

import styles from '@/styles/Home.module.css'

const generateRoomId = () => Math.random().toString(36).slice(2, 9)

export default function Home() {
  const router = useRouter()
  const [joinId, setJoinId] = useState('')

  const createRoom = () => {
    router.push(`/${generateRoomId()}`)
  }

  const joinRoom = (e) => {
    e.preventDefault()
    const trimmed = joinId.trim()
    if (!trimmed) return
    // Accept either a bare room id or a full URL someone pasted in.
    const id = trimmed.includes('/') ? trimmed.split('/').filter(Boolean).pop() : trimmed
    router.push(`/${id}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sketchbook</h1>
        <p className={styles.subtitle}>Draw together in real time.</p>

        <button className={styles.primaryButton} onClick={createRoom}>Create a new room</button>

        <div className={styles.divider}><span>or</span></div>

        <form className={styles.joinForm} onSubmit={joinRoom}>
          <input
            className={styles.input}
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Enter room ID"
          />
          <button className={styles.secondaryButton} type="submit" disabled={!joinId.trim()}>Join room</button>
        </form>
      </div>
    </div>
  )
}
