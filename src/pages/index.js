import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Every visit to "/" starts a fresh room and hands the shareable URL off
// to [roomId].js - anyone who opens that link joins the same session.
const generateRoomId = () => Math.random().toString(36).slice(2, 9)

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/${generateRoomId()}`)
  }, [router])

  return null
}
