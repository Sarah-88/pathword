import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from "../../../lib/mongodb";
import { letterList } from '../../../lib/utils';
import { APIResponse, ChatData, Player } from '../../../lib/types';
import { Db } from 'mongodb';
import { GameType, PuzzleType } from '../../../lib/types';
import Ably from "ably/promises";

const points = {
    easy: 1,
    normal: 2,
    hard: 4
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<APIResponse>
) {
    if (req.method !== 'POST') {
        res.status(400).send({ message: 'Only POST requests allowed' })
        return
    }
    const reqBody = JSON.parse(req.body);
    if (!reqBody.room || !req.query.id) {
        res.status(400).send({ message: 'Room and game id required' })
        return
    }
    try {
        const client = await clientPromise;
        const db = client.db("pathword");
        const game = await db.collection<GameType>('games').findOne({ gameId: req.query.id });
        if (!game) {
            res.status(404).send({ message: 'This game does not exist!' })
            return
        } else if (game.endAt && reqBody.room !== 'results') {
            res.status(400).send({ message: 'This game has ended' })
            return
        } else if (game.startAt && reqBody.room === 'room') {
            res.status(400).send({ message: 'This game has already started' })
            return
        }

        switch (reqBody.room) {
            case 'game':
                res.status(200).json({ message: `Game ${game.gameId} exists`, data: { exists: true } })
                break
            case 'lobby':
                const playerQuery = db.collection<Player>('players').find({ gameId: req.query.id })
                const players = await playerQuery.toArray()
                let teamPlayers: Array<{ team: string, players: string[] }> = game.teams.map((t) => {
                    const playersInTeam = players.filter(p => p.team === t).map(p => p.playerName)
                    return {
                        team: t,
                        players: playersInTeam
                    }
                })
                res.status(200).json({
                    message: 'Players in lobby of ' + req.query.id,
                    data: teamPlayers
                })
                break
            case 'paths':
                if (!reqBody.team) {
                    res.status(400).send({ message: 'Missing team' })
                    return
                }

                res.status(200).json({ message: 'Successfully retrieved paths', data: await getPathList(db, game, reqBody) })
                break
            case 'singlePath':
                const puzzleDisplay = getPuzzleDisplay(game, reqBody)
                if (puzzleDisplay?.error && puzzleDisplay.error.errorCode) {
                    res.status(puzzleDisplay.error.errorCode).json({ message: puzzleDisplay.error.message, data: puzzleDisplay.error.data })
                    return
                }

                res.status(200).json({ message: 'Retrieved puzzle', data: puzzleDisplay?.success })
                break
            case 'checkAnswer':
                let update: { ['$set']: any } = { $set: {} }
                for (const [k2, diff] of Object.entries(game.branches[reqBody.team])) {
                    let currIdx = 0
                    const currPuzzle = diff.find((d, i) => {
                        if (d.puzzleId === reqBody.puzzleId) {
                            currIdx = i
                            return d.puzzleId === reqBody.puzzleId
                        }
                    })
                    if (currPuzzle) {
                        const correct = currPuzzle.answer.toUpperCase() === reqBody.answer.toUpperCase()
                        if (correct && !currPuzzle.solved) {
                            update['$set'][`branches.${reqBody.team}.${k2}.${currIdx}.solved`] = true
                            const result = await db.collection('games').updateOne({ gameId: game.gameId }, update)
                            const scoreUpdate = await db.collection('players').updateOne({ playerId: reqBody.playerId }, { $inc: { score: points[k2 as keyof typeof points] } })
                            if (currPuzzle.clue && currPuzzle.clue !== 'numlet') {
                                const ablyClient = new Ably.Realtime(process.env.ABLY_API_KEY!);
                                const channel = ablyClient.channels.get(`chat-${req.query.id}-${reqBody.team}`);
                                await channel.publish({
                                    name: "get-clue", data: {
                                        text: `${reqBody.playerName} has discovered a new clue: ${currPuzzle.clue}`,
                                        id: reqBody.playerName,
                                        extra: { clue: currPuzzle.clue },
                                        area: {
                                            name: `path-${currIdx + 1}`,
                                            display: ''
                                        }
                                    } as ChatData
                                });
                            }
                        }
                        res.status(200).json({ message: correct ? 'Correct answer!' : 'Incorrect answer!', data: { correct, hasClue: !!currPuzzle.clue } })
                        return
                    }
                }

                res.status(400).send({ message: 'No such puzzle' })
                break
            case 'password':
                if (!reqBody.team) {
                    res.status(400).send({ message: 'Missing team' })
                    return
                }

                res.status(200).json({
                    message: 'Retrieved final puzzle', data: getFinalPuzzle(game, reqBody)
                })
                break
            case 'checkPassword':
                if (!reqBody.password || !reqBody.team) {
                    res.status(400).send({ message: 'Missing password/team' })
                    return
                }
                const ablyClient = new Ably.Realtime(process.env.ABLY_API_KEY!);
                const success = game.password.toUpperCase() === reqBody.password.toUpperCase()
                if (success) {
                    const playerQuery = db.collection<Player>('players').find({ gameId: req.query.id })
                    const players = await playerQuery.toArray()
                    let teamPoints = game.teams.map((t) => ({ team: t, score: 0 }))
                    players.forEach((p) => {
                        teamPoints[game.teams.indexOf(p.team!)].score += p.score ?? 0
                    })
                    teamPoints = teamPoints.sort((a, b) => a.score > b.score ? -1 : 1)
                    await db.collection('games').updateOne({ gameId: req.query.id }, { $set: { winner: teamPoints[0].score > teamPoints[1].score ? teamPoints[0].team : 'tie', endAt: new Date() } })

                    for (let i = 0; i < game.teams.length; i++) {
                        const channel = ablyClient.channels.get(`chat-${req.query.id}-${game.teams[i]}`);
                        await channel.publish({
                            name: "success-password", data: {
                                text: `${reqBody.playerName} has opened the door and ended the game! Transferring you to the results page in 10 seconds...`,
                                id: reqBody.playerName,
                                area: {
                                    name: `final`
                                }
                            } as ChatData
                        });
                    }

                } else {
                    const channel = ablyClient.channels.get(`chat-${req.query.id}-${reqBody.team}`);
                    await channel.publish({
                        name: "fail-password", data: {
                            text: `${reqBody.playerName} has entered the incorrect password and is repelled by the door! Will there be any other brave soul who can crack the password?`,
                            id: reqBody.playerName,
                            area: {
                                name: `final`
                            }
                        } as ChatData
                    });
                }
                res.status(200).json({ message: success ? "You've guessed correctly!" : "Incorrect! Entry denied!", data: { success } })
                break
            case 'results':
                res.status(200).json(await getResults(db, game))
                break
            default:
                res.status(400).send({ message: 'Invalid request' })
                break
        }
    } catch (e) {
        res.status(400).send({ message: 'Error!', data: e })
    }
}

async function getPathList(db: Db, game: GameType, reqBody: { [key: string]: string }) {
    const branches: GameType['branches'][0] = game.branches[reqBody.team as string];
    let branchReturn: { [key: string]: { puzzleId: string, required: boolean }[] } = {}
    let hints: { [key: string]: Array<string> } = {}
    for (const [k, v] of Object.entries(branches)) {
        branchReturn[k] = v.map((b) => {
            return {
                required: b.required,
                puzzleId: b.puzzleId
            }
        })
        hints[k] = v.map((b) => b.hint)
        hints[k] = hints[k].filter((a, i) => !(hints[k].indexOf(a) > -1 && hints[k].indexOf(a) !== i))
    }

    return { branchReturn, hints }
}

function getPuzzleDisplay(game: GameType, reqBody: { [key: string]: string }) {
    for (const [k, team] of Object.entries(game.branches)) {
        for (const [k2, diff] of Object.entries(team)) {
            const currPuzzle = diff.find((d, i) => d.puzzleId === reqBody.puzzleId)
            if (currPuzzle) {
                if (currPuzzle?.solved) {
                    return { error: { errorCode: 200, message: 'This puzzle has been solved', data: { solved: true } }, success: {} }
                } else {
                    const { clue, answer, ...returnPuzzle } = currPuzzle
                    return { success: returnPuzzle, error: {} }
                }
            }
        }
    }
    return { error: { errorCode: 400, message: 'No such puzzle' } }
}

function getFinalPuzzle(game: GameType, reqBody: { [key: string]: string }) {
    let clues: string[] = []
    let showNumLet = false
    for (const [k, v] of Object.entries(game.branches[reqBody.team])) {
        clues = clues.concat(v.filter(p => {
            if (p.clue === 'numlet') {
                showNumLet = !!p.solved
                return false
            }
            return p.solved && p.clue
        }).map(p => p.clue!))
    }

    return {
        display: showNumLet ? game.password.replace(/[A-Za-z0-9]/g, '_') : '?',
        clues: clues
    }
}

async function getResults(db: Db, game: GameType) {
    const playerQuery = db.collection<Player>('players').find({ gameId: game.gameId })
    const players = await playerQuery.toArray()
    const teams: { [key: string]: { name: string, score: number }[] } = { red: [], blue: [] }
    players.forEach(p => {
        if (p.team) {
            if (!teams[p.team]) {
                teams[p.team] = []
            }
            teams[p.team].push({ name: p.playerName, score: p.score ?? 0 })
        }
    })
    const result = Object.entries(teams).map(([k, v]) => {
        return { team: k, players: v.sort((a, b) => b > a ? -1 : 1) }
    })
    return {
        message: 'Retrieved game results', data: { winner: game.winner, teams: result }
    }
}
