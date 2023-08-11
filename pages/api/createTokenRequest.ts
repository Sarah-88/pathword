import Ably from "ably/promises";

export default async function handler(req:any, res:any) {
    const client = new Ably.Realtime(process.env.ABLY_API_KEY!);
    const tokenRequestData = await client.auth.createTokenRequest({ clientId: 'pathword-game' });
    res.status(200).json(tokenRequestData);
};