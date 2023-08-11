import clientPromise from "../../lib/mongodb";
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    const client = await clientPromise;
    const db = client.db("pathword");

    const list = [
        "Sparrow",
        "Robin",
        "Blue Jay",
        "Cardinal",
        "Crow",
        "Pigeon",
        "Seagull",
        "Duck",
        "Goose",
        "Swan",
        "Hawk",
        "Eagle",
        "Falcon",
        "Owl",
        "Woodpecker",
        "Penguin",
        "Parrot",
        "Canary",
        "Cockatiel",
        "Finch",
        "Cockatoo",
        "Peacock",
        "Turkey",
        "Chicken",
        "Gull",
        "Dove",
        "Albatross",
        "Vulture",
        "Kiwi",
        "Hummingbird",
        "Swallow",
        "Blackbird",
        "Pelican",
        "Quail",
        "Raven",
        "Magpie",
        "Emu",
        "Ostrich",
        "Kestrel",
        "Ibis",
        "Cormorant",
        "Gannet",
        "Heron",
        "Kingfisher",
        "Bald Eagle",
        "Osprey",
        "Wren",
        "Goshawk",
        "Spoonbill",
        "Puffin",
        "Toucan",
        "Shoebill",
        "Barn Owl",
        "Snowy Owl",
        "Great Horned Owl",
        "Red-Tailed Hawk",
        "Northern Mockingbird",
        "Yellow Warbler",
        "Great Blue Heron",
        "White Ibis",
        "Peregrine Falcon",
        "Black-Capped Chickadee",
        "Mallard Duck",
        "Northern Shoveler",
        "Wood Duck",
        "Bald Eagle",
        "Red-Shouldered Hawk",
        "Blue Jay",
        "Turkey Vulture",
        "Northern Harrier",
        "Chipping Sparrow",
        "Northern Flicker",
        "Eastern Phoebe",
        "Brown Thrasher",
        "Red-Winged Blackbird",
        "Eastern Meadowlark",
        "Eastern Bluebird",
        "Song Sparrow",
        "White-Crowned Sparrow"
    ]

    // for (let i = 0; i < list.length; i++) {
    //     const len = list[i].replace(/\s/g, '').length
    //     const result = await db.collection("puzzles").insertOne({
    //         puzzleId: Math.random().toString(36).slice(2),
    //         type: 'blanks',
    //         answer: list[i],//list[i].replace(/\b./g, (a) => a.toUpperCase()),
    //         difficulty: len >= 15 ? 'hard' : len >= 10 ? 'normal' : 'easy',
    //         hint: 'Bird'
    //     });
    //     console.log(result)
    // }
    await db.collection('puzzles').updateMany({ type: 'rebus' }, { $set: { hint: 'Phrase/Term' } })
    res.status(200).json({ message: 'success' })
}