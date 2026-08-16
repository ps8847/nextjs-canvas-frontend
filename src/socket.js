import { io } from "socket.io-client";
const URL = process.env.NODE_ENV === 'production' ? 'https://nextjs-canvas-backend.onrender.com' : 'http://localhost:5000'

// autoConnect is off: the Board component connects once it knows which
// room to join, and disconnects on unmount.
export const socket = io(URL, { autoConnect: false });
