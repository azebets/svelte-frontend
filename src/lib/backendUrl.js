export const serverUrl = () => {
    const isDevelopment = import.meta.env.DEV;
    return isDevelopment ? 'http://localhost:8001' : 'https://api.azebets.com';
};

// Optional: Add a specific WebSocket URL function
export const wsServerUrl = () => {
    const isDevelopment = import.meta.env.DEV;
    return isDevelopment ? 'ws://localhost:8001' : 'wss://api.azebets.com';
};


export const ServerURl = (()=>{
    return "http://localhost:8001"
    // return "https://wager-backend.onrender.com"
})

export const VerifyURl = () => {
    // return "http://localhost:5174/verify";
    return "https://wager-verification.netlify.app";
};

export const pageURL = () => {
    // return "http://localhost:5173";
    return "https://wager.services";
};

export const SocketURL = (()=>{
    // return "http://localhost:3000"
    return "https://wager-backend.vercel.app"
})