import { io } from "socket.io-client";
import axios from "axios"
import { serverUrl } from "$lib/backendUrl";
import { publicChat } from "$lib/store/profile";
import { dicegameplays } from "$lib/games/ClassicDice/store/index";

const URL = serverUrl();
if (!URL) {
    console.error('[Socket] Server URL is undefined. Check backendUrl.js configuration.');
    throw new Error('Server URL is undefined');
}

console.log('[Socket] Connecting to:', URL);

const socket = io(URL, {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket', 'polling'],
    path: '/socket.io'  // Make sure this matches your server configuration
});

// Add socket event listeners for debugging
socket.on('connect', () => {
    console.log('[Socket] Connected successfully');
});

socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error);
    console.error('[Socket] Error details:', {
        message: error.message,
        description: error.description,
        context: error.context
    });
});

socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
});

socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('[Socket] Reconnection attempt:', attemptNumber);
});

// Export socket instance for reuse
export { socket };

export const handleSocketConnection = async () => {
    socket.on("dice-gamePLayers", data => {
        dicegameplays.set(data)
    })
    socket.on("new-message", data => {
        publicChat.set(data)
    })
    const handlePublicChat = async (data) => {
        socket.emit("public-chat", data)
    }
    const handleDicebet = async (data) => {
        socket.emit("dice-game", data)
    }
    return {handlePublicChat, handleDicebet}
}

export const handleFetchPublicChat = (async()=>{
    await axios.get(`${URL}/auth/previus-chats`)
    .then((res) => {
        publicChat.set(res.data);
    })
    .catch((error)=>{
        console.log(error)
    })
})
