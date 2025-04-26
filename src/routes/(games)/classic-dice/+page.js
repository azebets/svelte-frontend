import { browser } from '$app/environment';
import { handleDiceGameEncrypt, DiceHistory } from "$lib/gameAPIs/dice";

export async function load({ params, parent }) {
    const data = await parent();
    
    if (browser) {
        // Prefetch initial data in parallel
        return Promise.all([
            handleDiceGameEncrypt(data.authToken),
            DiceHistory(data.authToken)
        ]).then(([encryptData, historyData]) => {
            return {
                encryption: encryptData,
                history: historyData
            };
        });
    }
    
    return {};
}