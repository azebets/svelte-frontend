import { io } from "socket.io-client";
import { serverUrl } from "$lib/backendUrl"
const URL = serverUrl();
const socket = io(`${URL}`);
import { processingRequest, hilo_game, userBets, recentBets, initializing } from "../store/index";
import { default_Wallet } from "$lib/store/coins";


export const socketEvents = ((user_id) => {
    const handleHiloBet = ((data) => {
        processingRequest.set(true);
        socket.emit("hilo-bet", data, (err) => {
            if (err) {
              // no ack from the server, let's retry
              handleHiloBet(data);
            }
        });

    })

    const handleHiloCashout = ((data) => {
        processingRequest.set(true);
        socket.emit("hilo-cashout", data, (err) => {
            if (err) {
              // no ack from the server, let's retry
              handleHiloCashout(data);
            }
        });
    })

    const handleHiloInit = ((data) => {
        initializing.set(true);
        processingRequest.set(true);
        socket.emit("hilo-init", data, (err) => {
            if (err) {
              // no ack from the server, let's retry
              handleHiloInit(data);
            }
        });
    })

    const handleHiloNextRound = ((data) => {
        processingRequest.set(true);
        socket.emit("hilo-next-round", data, (err) => {
            if (err) {
              // no ack from the server, let's retry
              handleHiloNextRound(data);
            }
        });
    })

    socket.on("hilo-game", data => {
        if (user_id === data.user_id) {
            hilo_game.update(v => ({
                error: undefined,
                ...v,
                ...data
            }));
            processingRequest.set(false);
        }
    })

    socket.on("hilo-game-ended", data => {
        if (user_id === data.user_id) {
            userBets.update(v => ([data, ...v]))
        }
        recentBets.update(v => ([data, ...v]))
    });
    socket.on("hilo-history", data => {
        if (user_id === data.user_id) {

            userBets.update(v => ([...data.userBets, ...v]))
            recentBets.update(v => ([...data.allRecentBets, ...v]))
            initializing.set(false);
        }
    });



    socket.on("hilo-wallet", data => {
        if (user_id === data.user_id) {
            // if (data.token === "USD") {
            //     btc_Wallet.update(v => ({
            //         ...v,
            //         balance: data.balance
            //     }))
            // }
            //  else if (data.token === "WGD") {
            //     wgdWallet.update(v => ({
            //         ...v,
            //         balance: data.balance
            //     }))
            // } else if (data.token === "WGF") {
            //     wgfWallet.update(v => ({
            //         ...v,
            //         balance: data.balance
            //     }))
            // } else if (data.token === "ETH") {
            //     ethWallet.update(v => ({
            //         ...v,
            //         balance: data.balance
            //     }))
            // }

            default_Wallet.update(v => ({
                ...v,
                balance: data.token === v.coin_name ? data.balance : v.balance
            }));
        }
    })
    return { handleHiloBet, handleHiloCashout, handleHiloNextRound, handleHiloInit }
})