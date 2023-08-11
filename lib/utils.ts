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
            "A large stone wall blocks the path going forward. Inscribed on it is 'Solve Me'."
        ],
        buttons: [buttonList.back, buttonList.solve]
    },
    puzzleOpt: {
        text: [
            "You found a puzzle on the side of the path. Surely it's not too difficult to solve?",
            "An abandoned puzzle looks to you with puppy eyes in the hopes you would unlock it.",
            "Inscribed on a nearby rock are a few characters. Taking a closer look, it appears to be a puzzle of some sorts."
        ],
        buttons: [buttonList.back, buttonList.solve, buttonList.skip]
    },
    noPuzzle: {
        text: [
            "Nothing dangerous appears to be here in the path.",
            "Not a puzzle in sight. Perhaps it's been solved?",
            "The peaceful calm in the path is strangely unsettling. You look around, but there is nothing of note."
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
            "You here a 'DING' sound and immediately check for a phone you don't have. Turns out you've correctly solved the puzzle, and you grab the clue it leaves behind."
        ],
        buttons: [buttonList.skip]
    },
    finishedPuzzleNoClue: {
        text: [
            "You've solved the puzzle! You wait for a magical clue to appear, but nothing happens. Cursing your luck, you toss the puzzle away.",
            "DING DING DING! Correct!! But after all the fanfare, bells and whistles, it becomes clear that this puzzle yielded no clues.",
            "The puzzle breaks apart as you guess the correct answer, leaving behind a piece of paper. Flipping the paper back and forth, it becomes clear that it is just a blank piece of paper. Your disappointment is immeasurable."
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
            "You've finished the game! Time to tally the scores!"
        ],
        buttons: [buttonList.finish]
    },
    failGame: {
        text: [
            "The door repels you, your answer clearly incorrect. The door continues to repel any further attempts to approach it. You can only lay your hopes on your other team mates now."
        ],
        buttons: [buttonList.back]
    },
    alreadyFail: {
        text: [
            "You are unable to approach any closer to the door."
        ],
        buttons: [buttonList.back]
    },
    othersEnd: {
        text: [
            "The door has been opened! Time to view the scores!"
        ],
        buttons: [buttonList.finish]
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