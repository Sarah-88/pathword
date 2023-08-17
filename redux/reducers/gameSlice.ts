import { createSlice } from '@reduxjs/toolkit';
const gameInitialState = {
    gameId: '',
    team: '',
    puzzles: { easy: [], normal: [], hard: [] },
    path: '',
    stage: '',
    progress: 0,
    failed: false,
    hint: {},
    clues: [] as string[],
    solved: [] as string[]
}
const gameSlice = createSlice({
    name: 'game',
    initialState: gameInitialState,
    reducers: {
        setGameId: (state, action) => {
            state.gameId = action.payload
            state.stage = 'lobby'
        },
        setTeam: (state, action) => {
            state.team = action.payload
        },
        setGameProgress: (state, action) => {
            if (action.payload.path) {
                state.path = action.payload.path
            }
            if (action.payload.stage) {
                state.stage = action.payload.stage
            }
            if (action.payload.progress) {
                state.progress = action.payload.progress
            }
        },
        setPuzzles: (state, action) => {
            state.puzzles = action.payload
        },
        setFailed: (state) => {
            state.failed = true
        },
        addClue: (state, action) => {
            if (state.clues && !state.clues.includes(action.payload)) {
                state.clues.push(action.payload)
            } else if (!state.clues) {
                state.clues = [action.payload]
            }
        },
        setClues: (state, action) => {
            state.clues = action.payload
        },
        addSolved: (state, action) => {
            if (state.solved) {
                state.solved = { ...state.solved, ...action.payload }
            } else {
                state.solved = action.payload
            }
        },
        setSolved: (state, action) => {
            state.solved = action.payload
        },
        addHint: (state, action) => {
            state.hint = { ...state.hint, ...action.payload }
        },
        resetGame: () => gameInitialState
    }
})

export const { setGameId, setTeam, setGameProgress, setPuzzles, setFailed, resetGame, setClues, addClue, addSolved, setSolved, addHint } = gameSlice.actions;
export default gameSlice.reducer;