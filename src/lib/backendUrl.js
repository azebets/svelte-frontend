import { browser } from '$app/environment'

export const serverUrl = () => {
  if(browser){
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1"){
      return "http://localhost:8001";
    }else{
      return "https://azebets.onrender.com";
    }
  }
}

export const clientUrl = () => {
  if(browser){
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1"){
      return "http://localhost:5173";
    }else{
      return "https://azebets.onrender.com";
    }
  }
}
