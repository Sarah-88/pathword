import { NextApiRequest, NextApiResponse } from "next";
import { APIResponse, GameType, PuzzleType } from "../../../lib/types";
import clientPromise from "../../../lib/mongodb";

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
    if (!reqBody.answer || !req.query.id || !reqBody.gameId || !reqBody.playerId) {
        res.status(400).send({ message: 'Puzzle id, answer, game id, player id required' })
        return
    }
    try {
        const client = await clientPromise;
        const db = client.db("pathword");
        const puzzle = await db.collection<PuzzleType>('puzzles').findOne({ puzzleId: req.query.id });
        const game = await db.collection<GameType>('games').findOne({ gameId: reqBody.gameId })
        if (!puzzle || !game) {
            res.status(400).send({ message: 'Invalid puzzle' })
            return
        }
        const correct = puzzle.answer.toUpperCase() === reqBody.answer.toUpperCase()
        let gamePuzzleClue = ''
        if (correct) {
            let update: { ['$set']: any } = { $set: {} }
            outerLoop:
            for (const [k, t] of Object.entries(game.branches)) {
                for (const [k2, d] of Object.entries(t)) {
                    for (let i = 0; i < d.length; i++) {
                        if (d[i].puzzleId === req.query.id) {
                            update['$set'][`branches.${k}.${k2}.${i}.solved`] = true
                            gamePuzzleClue = d[i].clue ?? ''
                            break outerLoop
                        }
                    }
                }
            }
            const result = await db.collection('games').updateOne({ gameId: reqBody.gameId }, update)
            const scoreUpdate = await db.collection('players').updateOne({ playerId: reqBody.playerId }, { $inc: { score: points[puzzle.difficulty as keyof typeof points] } })
        }
        res.status(200).json({ message: correct ? 'Correct answer!' : 'Incorrect answer!', data: { correct, hasClue: !!gamePuzzleClue } })
    } catch (e) {
        console.log(e)
        res.status(400).send({ message: 'Error!', data: e })
    }
}