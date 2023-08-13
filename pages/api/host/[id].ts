import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from "../../../lib/mongodb";
import { GameType, APIResponse, Player } from '../../../lib/types';
import Ably from "ably/promises";

type BranchType = { enabled: boolean, clues: string[], maxPath: number, minPath: number }

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<APIResponse>
) {
    if (req.method !== 'POST') {
        res.status(400).send({ message: 'Only POST requests allowed' })
        return
    }
    if (!req.query.id || !req.headers['pathword-admin']) {
        res.status(400).send({ message: 'Game ID and password required' })
        return
    }

    const client = await clientPromise;
    const db = client.db("pathword");

    const game = await db.collection<GameType>('games').findOne({ gameId: req.query.id, adminPassword: req.headers['pathword-admin'] })
    if (!game) {
        res.status(400).send({ message: 'No such game and password exists' })
        return
    }
    const reqBody = JSON.parse(req.body || '{}')
    if (reqBody.start) {
        await db.collection('games').updateOne({ gameId: req.query.id }, { $set: { startAt: new Date() } })
        const ablyClient = new Ably.Realtime(process.env.ABLY_API_KEY!);
        const channel = ablyClient.channels.get(`lobby-${req.query.id}`);
        channel.publish({
            name: "game-start",
            data: {
                display: `Game has started!`,
            }
        });
        res.status(200).json({ message: 'Game Start!', data: { start: true } })
        return
    } else if (reqBody.end) {
        const playerQuery = db.collection<Player>('players').find({ gameId: req.query.id })
        const players = await playerQuery.toArray()
        let teamPoints = game.teams.map((t) => ({ team: t, score: 0 }))
        players.forEach((p) => {
            teamPoints[game.teams.indexOf(p.team!)].score += p.score ?? 0
        })
        teamPoints = teamPoints.sort((a, b) => a.score > b.score ? -1 : 1)
        await db.collection('games').updateOne({ gameId: req.query.id }, { $set: { winner: teamPoints[0].score > teamPoints[1].score ? teamPoints[0].team : 'tie', endAt: new Date() } })
        const ablyClient = new Ably.Realtime(process.env.ABLY_API_KEY!);
        for (let i = 0; i < game.teams.length; i++) {
            const channel = ablyClient.channels.get(`chat-${req.query.id}-${game.teams[i]}`);
            await channel.publish({
                name: "success-password", data: {
                    text: `The game has been ended by the host. Transferring you to the results page in 10 seconds...`,
                    id: 'Game Host',
                    area: {
                        name: `final`
                    }
                }
            });
        }
        res.status(200).json({ message: 'Game Ended!', data: { end: true } })
        return
    } else if (reqBody.removePlayer) {
        const result = await db.collection('players').deleteOne({ playerId: reqBody.removePlayer, gameId: req.query.id })
        const ablyClient = new Ably.Realtime(process.env.ABLY_API_KEY!);
        const channel = ablyClient.channels.get(`lobby-${req.query.id}`);
        await channel.publish({
            name: "leave-room", data: {
                id: reqBody.removePlayer,
                display: `${reqBody.playerName} has left the lobby`,
                player: reqBody.playerName,
            }
        });
        res.status(200).json({ message: 'Updated game', data: { success: result.deletedCount === 1 } })
        return
    }

    const playerQuery = db.collection<Player>('players').find({ gameId: req.query.id })
    const players = await playerQuery.toArray()
    let response: { message: string, data: any } = { message: '', data: {} }
    const teamList: { team: string, players: { name: string, id: string, score: number }[] }[] = Object.keys(game.branches).map((t) => ({ team: t, players: [] }))
    if (!game.endAt && !game.startAt) {
        teamList.push({ team: 'noteam', players: [] })
    }
    players.forEach(p => {
        if (!p.team) {
            p.team = 'noteam'
        }
        let teamMatch = teamList.findIndex(t => t.team === p.team)
        if (teamMatch === -1) {
            teamMatch = teamList.length
            teamList.push({ team: p.team, players: [] })
        }
        teamList[teamMatch].players.push({ name: p.playerName, id: p.playerId, score: p.score ?? 0 })
    })
    if (game.endAt) {
        response.message = 'Showing game results'
        response.data = {
            type: 'results', winner: game.winner, list: teamList.map(tl => {
                return { ...tl, players: tl.players.sort((a, b) => b.score > a.score ? -1 : 1) }
            })
        }
    } else if (game.startAt) {
        let answerList: { [key: string]: { [key: string]: { display?: string, answer: string, hint?: string } } } = {}
        Object.entries(game.branches).forEach(([t, b]) => {
            if (!answerList[t]) {
                answerList[t] = { final: { answer: game.password } }
            }
            Object.entries(b).forEach(([diff, pz]) => {
                pz.forEach((p, idx) => {
                    answerList[t][`pathway-${diff}-${idx + 1}`] = { display: p.display!, answer: p.answer, hint: p.hint }
                })
            })
        })
        response.message = 'Showing game progress'
        response.data = { type: 'paths', answerList, list: teamList }
    } else {
        response.message = 'Showing player lobby'
        response.data = { type: 'lobby', list: teamList }
    }

    res.status(200).json(response)
}
