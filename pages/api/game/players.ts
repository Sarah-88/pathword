// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from "../../../lib/mongodb";
import Ably from "ably/promises";
import { Player } from '../../../lib/types';

type Data = {
    data?: any,
    message: string,
    debug?: any
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        res.status(400).send({ message: 'Only POST requests allowed' })
        return
    }
    const client = await clientPromise;
    const db = client.db("pathword");
    const reqBody = JSON.parse(req.body);
    if (reqBody.playerName && !reqBody.playerId && reqBody.gameId) {
        const player = await db.collection<Player>("players").findOne({ playerName: { $regex: reqBody.playerName, $options: 'i' }, gameId: reqBody.gameId });
        if (player) {
            res.status(400).send({ message: 'This player name already exists' })
            return
        }
    } else if (!reqBody.playerId || !reqBody.gameId) {

    }

    const player = reqBody.playerId ? await db.collection<Player>("players").findOne({ playerId: reqBody.playerId, gameId: { $in: [reqBody.gameId] } }) : undefined;
    let { leave, ...requestBody } = reqBody;
    if (!player) {
        requestBody.playerId = (Math.random().toString(16).slice(2) + '-' + new Date().valueOf().toString(16)).toUpperCase();
    }
    const ablyClient = new Ably.Realtime(process.env.ABLY_API_KEY!);
    const channel = ablyClient.channels.get(`lobby-${reqBody.gameId}`);

    let result
    if (leave) {
        result = await db.collection("players").deleteOne({ playerId: requestBody.playerId, gameId: reqBody.gameId })
        await channel.publish({
            name: "leave-room", data: {
                display: `${player?.playerName} has left the lobby`,
                player: player?.playerName,
            }
        });
    } else {
        result = await db.collection("players").updateOne({ playerId: requestBody.playerId, gameId: reqBody.gameId }, { $set: requestBody }, { upsert: true })
        if (reqBody.playerId && reqBody.team) {
            await channel.publish({
                name: "joined-team", data: {
                    display: `${player?.playerName} has joined the ${reqBody.team} team!`,
                    player: player?.playerName,
                    team: reqBody.team
                }
            });
        }
    }
    if (result) {
        res.status(200).json({ message: reqBody.playerId ? 'Updated player info' : 'Added player to game', data: { playerId: requestBody.playerId } })
    } else {
        res.status(400).send({ message: 'Failed to update player info' })
    }
}
