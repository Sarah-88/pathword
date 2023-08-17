import { createSlice } from '@reduxjs/toolkit';
const playerSlice = createSlice({
    name: 'player',
    initialState: {
        id: '',
        name: '',
        score: 0
    },
    reducers: {
        setPlayer: (state, action) => {
            state.name = action.payload.name
            state.id = action.payload.id
        },
        setScore: (state, action) => {
            state.score = (state.score ?? 0) + action.payload
        },
        resetScore: (state) => {
            state.score = 0
        }
    }
})

export const { setPlayer, setScore, resetScore } = playerSlice.actions;
export default playerSlice.reducer;