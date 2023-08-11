import { Provider } from 'react-redux'
import Redux from '../redux/store'
import { PersistGate } from 'redux-persist/integration/react'
import '../styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <Provider store={Redux.store}>
            <PersistGate loading={null} persistor={Redux.persistor}>
                <Component {...pageProps} />
            </PersistGate>
        </Provider>)
}
