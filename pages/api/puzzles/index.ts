import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from "../../../lib/mongodb";

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
    const reqBody = JSON.parse(req.body);
    if (!reqBody.answer || !reqBody.difficulty || !reqBody.type) {
        res.status(400).send({ message: 'Answer, difficulty & type required' })
        return
    }
    const client = await clientPromise;
    const db = client.db("pathword");

    const exist = await db.collection("puzzles").findOne({ answer: reqBody.answer, difficulty: reqBody.difficulty });

    const puzzleId = exist ? exist.puzzleId : Math.random().toString(36).slice(2);

    const result = await db.collection("puzzles").updateOne({ puzzleId: puzzleId }, { $set: { ...reqBody, puzzleId } }, { upsert: true })
    if (result) {
        res.status(200).json({ message: 'Updated puzzle info' })
    } else {
        res.status(400).send({ message: 'Failed to update puzzle info' })
    }
}
