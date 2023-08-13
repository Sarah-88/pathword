export type APIResponse = {
    data?: any,
    message: string
}
export type PlayerInfo = { id: string, name?: string }
export type ReduxState = {
    player: { id: string, name: string },
    game: {
        gameId: string,
        team: string,
        puzzles: { [key: string]: { puzzleId: string, required: boolean }[] },
        path: string,
        stage: string,
        progress: number,
        failed: boolean,
        clues: string[],
        solved?: { [key: string]: string }
    }
}

export type PlayerLoc = { [key: string]: { [name: string]: { display: string, name: string } } }

export type ChatData = {
    author?: string,
    text: string,
    id: string,
    extra?: { [key: string]: any },
    area: { name: string, display: string },
}

export type DialogProps = {
    visible?: boolean;
    backdropType?: 'blur' | 'black' | 'none';
    title?: string;
    desc?: string;
    textDisplay?: string;
    large?: boolean;
    input?: boolean;
    inputPrep?: string;
    inputError?: string;
    subText?: string;
    getClues?: boolean;
    availableLetters?: string[];
    imageDisplay?: string;
    buttons?: {
        text: string;
        reqInput?: number;
        callback: (value?: string) => void;
    }[];
}

export type GameType = {
    gameId: string,
    teams: string[],
    branches: {
        [key: string]: {
            [key: string]: {
                required: boolean,
                puzzleId: string,
                clue?: string,
                answer: string,
                hint: string,
                type: string,
                longText?: string,
                solved?: boolean,
                display?: string,
                image?: string,
                lettersAvailable: string[]
            }[]
        }
    },
    password: string,
    adminPassword: string,
    startAt?: Date,
    endAt?: Date,
    winner?: string,
}

export type PuzzleType = {
    puzzleId: string,
    answer: string,
    difficulty: string,
    longText?: string,
    image?: string,
    hint: string,
    type: string
}

export type Player = {
    gameId: string,
    playerId: string,
    playerName: string,
    team?: string,
    score?: number
}