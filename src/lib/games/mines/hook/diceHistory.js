import { mine_history } from "../store/index"
import { serverUrl } from "$lib/backendUrl"
import { browser } from '$app/environment';
import axios from "axios";

export const MinesHistory = () => {
    const user = browser && JSON.parse(localStorage.getItem('user'))
    const _user = browser && document.cookie.match(/secret=([^;]+)/)?.[1];
    const historyMines = async (data) => {
      const response = await fetch(
        `${serverUrl()}/api/user/mine-game/mine-history`,{
          method: "GET",
          headers: {
            "Content-type": "application/json",
            'Authorization': `Bearer ${_user}`
          },
        }
      );
      const json = await response.json();
      if (!response.ok) {
        console.log(json.error)
      }
      if (response.ok) {
        mine_history.set(json)
      }
    };
    return { historyMines};
};

export const handleLostBet = (async (data, auth) => {
  let response = ""
  await axios.post(`${serverUrl()}/api/user/mine-game/lost-bet`, {
          data
      }, {
          headers: {
              Authorization: `Bearer ${auth}`
          }
      })
      .then((res) => {
        response = res.data[0]
          // mine_history.set([...$mine_history, res.data[0]])
          // handleMinesHistory(res.data[0])
      })
      .catch((error) => {
          console.log(error)
      })
     return response 
})