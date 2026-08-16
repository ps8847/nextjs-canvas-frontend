import { useEffect, useState } from "react"
import { useRouter } from "next/router"

import Menu from "@/components/Menu"
import Toolbox from "@/components/Toolbox"
import Board from "@/components/Board"
import Chat from "@/components/Chat"
import JoinModal from "@/components/JoinModal"
import { CURSOR_COLORS } from "@/constants"

const NAME_STORAGE_KEY = 'sketch_username'

export default function Room() {
  const router = useRouter()
  const { roomId } = router.query

  const [name, setName] = useState(null)
  const [color] = useState(() => CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)])

  // Skip the join prompt for anyone who has already picked a name before.
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(NAME_STORAGE_KEY) : null
    if (saved) setName(saved)
  }, [])

  const handleJoin = (chosenName) => {
    window.localStorage.setItem(NAME_STORAGE_KEY, chosenName)
    setName(chosenName)
  }

  // router.query is empty on the very first client render before hydration
  // picks up the dynamic segment - wait for it rather than joining "undefined".
  if (!roomId) return null

  if (!name) {
    return <JoinModal onJoin={handleJoin} />
  }

  return (
    <>
      <Menu />
      <Toolbox />
      <Board roomId={roomId} userName={name} userColor={color} />
      <Chat selfName={name} />
    </>
  )
}
