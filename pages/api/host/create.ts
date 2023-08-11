import type { NextApiRequest, NextApiResponse } from 'next'
import { getRandom, letterList } from "../../../lib/utils";
import { APIResponse, GameType, PuzzleType } from "../../../lib/types";
import clientPromise from "../../../lib/mongodb";
import { Db } from 'mongodb';

type BranchType = { enabled: boolean, clues: string[], maxPath: number, minPath: number }

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<APIResponse>
) {
    if (req.method !== 'POST') {
        res.status(400).send({ message: 'Only POST requests allowed' })
        return
    }
    const reqBody = JSON.parse(req.body);
    if (!reqBody.password || !reqBody.adminPassword || !reqBody.branches) {
        res.status(400).send({ message: 'Passwords and branches required' })
        return
    }
    const client = await clientPromise;
    const db = client.db("pathword");

    const gameId = Math.random().toString(36).slice(2, 10).toUpperCase()
    const teams = ['red', 'blue']
    let branches: GameType['branches'] = {}
    let puzzleCount: { [key: string]: number } = {}
    Object.entries(reqBody.branches as { [key: string]: BranchType }).forEach(([k, v], idx) => {
        if (v.enabled) {
            puzzleCount[k] = v.maxPath
        }
    })
    let puzzleList: { [key: string]: PuzzleType[] } = {}
    const difficulty = Object.keys(puzzleCount)
    for (const [k, v] of Object.entries(puzzleCount)) {
        const query = db.collection('puzzles').aggregate([{ $match: { difficulty: k } }, { $sample: { size: v * 3 } }])
        puzzleList[k] = await query.toArray() as PuzzleType[]
        //last item
        if (difficulty[difficulty.length - 1] === k) {
            reqBody.branches[k].clues.push('numlet')
        }
    }

    const modifier: { [key: string]: number } = {
        easy: 0,
        normal: 1,
        hard: 2
    }

    teams.forEach((t) => {
        branches[t] = {}
        Object.entries(puzzleCount).forEach(([k, v]) => {
            branches[t][k] = []
            for (let i = 0; i < v; i++) {
                const chosenPuzzleIdx = getRandom(0, puzzleList[k].length - 1)
                const chosenPuzzle = puzzleList[k].splice(chosenPuzzleIdx, 1)[0]
                const req = Math.floor(Math.random() * v) - (modifier[k] ?? 0) > i
                branches[t][k].push({
                    clue: reqBody.branches[k].clues[i],
                    ...getPuzzleDisplay(db, chosenPuzzle, req)
                })
            }
            branches[t][k] = branches[t][k].sort(() => 0.5 - Math.random() > 0 ? 1 : -1)
        })
    })

    const game: GameType = {
        gameId,
        teams,
        password: reqBody.password,
        adminPassword: reqBody.adminPassword,
        branches
    }

    const result = await db.collection('games').insertOne(game)

    res.status(200).json({ message: 'Test', data: { success: !!result.insertedId, gameId } })
}

function getPuzzleDisplay(db: Db, puzzleInfo: PuzzleType, required: boolean) {
    let puzzleDisplay = {
        puzzleId: puzzleInfo.puzzleId,
        hint: puzzleInfo.hint,
        type: puzzleInfo.type,
        required: required,
        answer: puzzleInfo.answer,
        display: '',
        desc: '',
        image: '',
        lettersAvailable: [] as string[]
    }
    let decoyCount = 0
    let revealLettersRatio = 2 / 5
    const ansb = puzzleInfo.answer.split('').map(l => l.toUpperCase())
    let lettersDecoy: string[] = []
    switch (puzzleInfo?.type) {
        case 'blanks':
            /**
             * Difficulty settings:
             * easy - 2 letters for every 5 characters revealed, only the correct ones available
             * normal - 2 letter for every 6 characters revealed, correct ones + 5 decoys available
             * hard - 2 letter for every 7 characters revealed, correct ones + 6 decoys available
             */
            switch (puzzleInfo.difficulty) {
                case "hard":
                    revealLettersRatio = 2 / 7
                    decoyCount = 6
                    if (ansb.filter(a => !!a).length >= 15) {
                        revealLettersRatio = 3 / 7
                    }
                    break
                case "normal":
                    revealLettersRatio = 2 / 6
                    decoyCount = 5
                    break
                case "easy":
                    if (ansb.filter(a => !!a).length <= 5) {
                        decoyCount = 4
                    }
                    break
            }
            let revealLetters = Math.floor(ansb.filter(a => !!a).length * revealLettersRatio)
            let letterCount: { [key: string]: number } = {}
            ansb.forEach((a) => {
                if (/[^A-Za-z]/.test(a)) {
                    return
                }
                if (!letterCount[a]) {
                    letterCount[a] = 0
                }
                letterCount[a]++
            })
            const letterOccurence = Object.entries(letterCount).sort(([letter, count], [letter2, count2]) => count > count2 ? -1 : 1)
            lettersDecoy = [...letterList]
                .filter(l => !ansb.includes(l))
                .sort(() => 0.5 - Math.random())
                .slice(0, decoyCount)
            let lettersToShow: string[] = []
            for (let i = 0; i < letterOccurence.length; i++) {
                if (letterOccurence[i][1] > revealLetters) {
                    continue
                }
                if (letterOccurence[i][1] === 1) {
                    if (letterOccurence[i + 1] && Math.random() > 0.5) {
                        continue
                    }
                    lettersToShow.push(letterOccurence[i][0])
                    revealLetters--
                } else {
                    lettersToShow.push(letterOccurence[i][0])
                    revealLetters -= letterOccurence[i][1]
                }
                if (revealLetters === 0) {
                    break
                }
            }
            puzzleDisplay.display = ansb.map(a => {
                if (/[^A-Za-z]/.test(a) || lettersToShow.includes(a)) {
                    return a
                }
                return '_'
            }).join('')
            puzzleDisplay.lettersAvailable = letterList.filter(l =>
                (ansb.includes(l) && !lettersToShow.includes(l)) || lettersDecoy.includes(l)
            )
            break
        case 'riddle':
            /**
             * Difficulty setting (no reveals)
             * easy - 4 decoys
             * normal - 8 decoys
             * hard - all available
             */
            switch (puzzleInfo.difficulty) {
                case 'easy':
                    decoyCount = 4
                    break
                case 'normal':
                    decoyCount = 8
                    break
                case 'hard':
                    decoyCount = 26
                    break
            }
            lettersDecoy = [...letterList]
                .filter(l => !ansb.includes(l))
                .sort(() => 0.5 - Math.random())
                .slice(0, decoyCount)
            puzzleDisplay.display = ansb.map(a => /[^A-Za-z]/.test(a) ? a : '_').join('')
            puzzleDisplay.lettersAvailable = letterList.filter(l =>
                ansb.includes(l) || lettersDecoy.includes(l)
            )
            puzzleDisplay.desc = puzzleInfo.longText!
            break
        case 'rebus':
            /**
             * Difficulty setting (no reveals)
             * easy - only correct ones available
             * normal - 8 decoys
             * hard - all available
             */
            switch (puzzleInfo.difficulty) {
                case 'normal':
                    decoyCount = 8
                    break
                case 'hard':
                    decoyCount = 26
                    break
            }
            lettersDecoy = [...letterList]
                .filter(l => !ansb.includes(l))
                .sort(() => 0.5 - Math.random())
                .slice(0, decoyCount)
            puzzleDisplay.display = ansb.map(a => /[^A-Za-z]/.test(a) ? a : '_').join('')
            puzzleDisplay.lettersAvailable = letterList.filter(l =>
                ansb.includes(l) || lettersDecoy.includes(l)
            )
            puzzleDisplay.image = puzzleInfo.image!
            break
    }
    return puzzleDisplay
}
