import { combineReducers, configureStore } from '@reduxjs/toolkit'
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import thunk from 'redux-thunk';
import playerReducer from './reducers/playerSlice'
import gameReducer from './reducers/gameSlice'

const persistConfig = {
    key: 'root',
    storage,
}

const rootReducer = combineReducers({
    player: playerReducer,
    game: gameReducer
})
const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
    reducer: persistedReducer,
    middleware: [thunk]
})

const persistor = persistStore(store)

export default { store, persistor }
