import { createSlice } from '@reduxjs/toolkit';
const playerSlice = createSlice({
    name: 'player',
    initialState: {
        id: '',
        name: ''
    },
    reducers: {
        setPlayer: (state, action) => {
            state.name = action.payload.name
            state.id = action.payload.id
        }
    }
})

export const { setPlayer } = playerSlice.actions;
export default playerSlice.reducer;