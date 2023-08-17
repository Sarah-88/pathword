export function getSettings(type: string) {
    const game = localStorage.getItem(type)
    if (game) {
        const decoded = JSON.parse(atob(game))
        return decoded
    }
    return {}
}

export function saveSettings(type: string, settings: { [key: string]: any }) {
    const currSetting = getSettings(type)
    localStorage.setItem(type, btoa(JSON.stringify({ ...currSetting, ...settings })))
}

export function shuffle(array: Array<any>) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

export const letterList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

const buttonList = {
    back: { type: "back", text: "Go Back" },
    skip: { type: "forward", text: "Move On" },
    solve: { type: "solve", text: "Solve It!" },
    finish: { type: "finish", text: "Lets go!" }
}
const dialogList = {
    puzzleReq: {
        text: [
            "You've found a puzzle blocking your way. It refuses to budge unless you solve it.",
            "A nasty puzzle blocks your way!",
            "A large stone wall blocks the path going forward. Inscribed on it is a puzzle.",
            "A massive boulder rolls down and blocks your path. Strangely enough, there is a puzzle on it.",
            "A massive stone puzzle stands tall, its pieces forming an impassable barrier along the path.",
            "A puzzle gateway guards the path, challenging adventurers to decipher its intricate secrets before proceeding.",
            "A puzzle door bars the way, its intricate patterns suggesting that only those who solve its mystery can unlock the passage."
        ],
        buttons: [buttonList.back, buttonList.solve]
    },
    puzzleOpt: {
        text: [
            "You found a puzzle on the side of the path. Surely it's not too difficult to solve?",
            "Inscribed on a nearby rock are a few characters. Taking a closer look, it appears to be a puzzle of some sorts.",
            "A mosaic of colors glint from the puzzle discarded by the path, waiting for someone to solve its enigmatic pattern.",
            "Among the leaves lies a puzzle, its missing pieces leaving an enticing challenge for any passerby.",
            "An abandoned puzzle lays by the path, its unassembled pieces inviting curious minds to piece together its secrets.",
            "A puzzle, half-finished and half-forgotten, rests by the path, daring those who pass to complete its intricate design.",
            "Among the wildflowers lies a puzzle, its pieces as vibrant and diverse as the blossoms around it.",
            "The puzzle's incomplete image hints at a challenge abandoned, urging anyone who stumbles upon it to take up the task."
        ],
        buttons: [buttonList.back, buttonList.solve, buttonList.skip]
    },
    noPuzzle: {
        text: [
            "Nothing dangerous appears to be here in the path.",
            "Not a puzzle in sight. Perhaps it's been solved?",
            "The peaceful calm in the path is strangely unsettling. You look around, but there is nothing of note.",
            "A sense of calm blankets the path, the serene stillness broken only by the soft rustling of leaves, inviting quiet contemplation. You find nothing interesting here.",
            "The path exudes a serene stillness, the silence almost palpable and soothing, yet with an undercurrent of unease in its peacefulness.",
            "An almost supernatural calm hangs in the air, shrouding the path in an eerie stillness that beckons exploration with caution.",
            "The air hangs motionless, lending an eerie calm to the path, where even the footsteps seem to be absorbed into the tranquil surroundings.",
            "The path is draped in a calm, eerie tranquility, where the lack of movement feels like a prelude to something unknown. You check the surroundings, but there are no puzzles to be found."
        ],
        buttons: [buttonList.back, buttonList.skip]
    },
    finalPassword: {
        text: [
            "A large door stands before you, the only way to the exit. To open it, you need to provide the password with the help of all the clues you gathered so far. Be warned that you only have one chance to answer correctly."
        ],
        buttons: [buttonList.back, buttonList.solve]
    },
    finishedPuzzle: {
        text: [
            "You've correctly guessed the answer! The puzzle fades away and leaves behind a clue, which you record for later.",
            "You've solved the puzzle! Behind it is a clue, which you keep for later.",
            "You hear a 'DING' sound and immediately check for a phone you don't have. Turns out you've correctly solved the puzzle, and you grab the clue it leaves behind.",
            "The puzzle cracks open like a fortune cookie and you find a clue inside. You keep it for later."
        ],
        buttons: [buttonList.skip]
    },
    finishedPuzzleNoClue: {
        text: [
            "You've solved the puzzle! You wait for a magical clue to appear, but nothing happens. Cursing your luck, you toss the puzzle away.",
            "DING DING DING! Correct!! But after all the fanfare, bells and whistles, it becomes clear that this puzzle yielded no clues.",
            "The puzzle breaks apart as you guess the correct answer, leaving behind a piece of paper. Flipping the paper back and forth, it becomes clear that it is just a blank piece of paper. Your disappointment is immeasurable.",
            "The puzzle removes itself from existence before your very eyes. Sadly, it didn't leave behind any clue."
        ],
        buttons: [buttonList.skip]
    },
    otherFinished: {
        text: [
            "A breeze rushes by and the puzzle is blown away! Or maybe that was just your team mate solving it faster than you."
        ],
        buttons: [buttonList.skip]
    },
    endGame: {
        text: [
            "You've finished the game and opened the door! The portal warms up, and will take you to the next screen in 10 seconds..."
        ],
        buttons: []
    },
    failGame: {
        text: [
            "The door repels you, your answer clearly incorrect. The door continues to repel any further attempts to approach it. You can only lay your hopes on your other team mates now."
        ],
        buttons: [buttonList.back]
    },
    alreadyFail: {
        text: [
            "You are unable to approach any closer to the door.",
            "The door radiates an invisible force, pushing you back each time you attempt to approach.",
            "The door seems to ripple with a faint energy, repelling you, your chance at it clearly over.",
            "The door shimmers with an enchantment that repels you, as if it senses your presence and keeps you at bay with an imperceptible force.",
            "An unseen power emanates from the door, thwarting your attempts to draw near.",
            "The door's energy pulses with a rhythmic force, pushing you back with each attempt to approach."
        ],
        buttons: [buttonList.back]
    },
    othersEnd: {
        text: [
            "The door has been opened! The portal warms up, and will take you to the next screen in 10 seconds..."
        ],
        buttons: []
    }
}
export type DialogObject = {
    text: string,
    buttons: Array<{
        type: string,
        text: string
    }>
}
export function getDialog(type: string): DialogObject {
    const textOpt = dialogList[type as keyof typeof dialogList]
    return {
        text: textOpt.text[getRandom(0, textOpt.text.length - 1)],
        buttons: textOpt.buttons
    }
}

export function getRandom(min: number, max: number) {

    return Math.floor(Math.random() * (max - min + 1)) + min
}