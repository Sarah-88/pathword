import { Baloo_2, Luckiest_Guy, Macondo } from 'next/font/google'
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Dialog from '../../components/Dialog';
import { Spinner } from '../../components/Spinner';
import dynamic from 'next/dynamic';
import { DialogProps, PlayerLoc } from '../../lib/types';
import Head from 'next/head';

const baloo = Baloo_2({ subsets: ['latin'] })
const lucky = Luckiest_Guy({ subsets: ['latin'], weight: "400" })
const macondo = Macondo({ weight: "400", subsets: ['latin'] });

const HostProgress = dynamic(() => import('../../components/HostProgress'), { ssr: false })
const HostLobby = dynamic(() => import('../../components/HostLobby'), { ssr: false })

const HostView = () => {
    const router = useRouter()
    const [screenType, setScreenType] = useState('')
    const [listData, setListData] = useState<{ team: string, players: { id: string, name: string, score: number }[] }[]>()
    const [winner, setWinner] = useState('')
    const [password, setPassword] = useState('')
    const [isReady, setIsReady] = useState(true)
    const [showSpinner, setShowSpinner] = useState(false)
    const [dialog, setDialog] = useState<DialogProps>({ backdropType: 'black', visible: false })
    const [playerLoc, setPlayerLoc] = useState<PlayerLoc>({})
    const [gameAnswers, setGameAnswers] = useState<{ [key: string]: { [key: string]: { answer: string, display?: string, hint?: string } } }>()

    const fetchData = useCallback((id: string, password: string) => {
        fetch('/api/host/' + id, { method: 'POST', headers: { 'pathword-admin': password } })
            .then(response => response.json())
            .then(resp => {
                if (!resp.data) {
                    setDialog((state) => ({
                        ...state,
                        inputError: 'Incorrect password!',
                        title: 'Enter Game Password for ' + id,
                        input: true,
                        visible: true,
                        buttons: [{
                            text: 'Submit', reqInput: 1, callback: (val?: string) => {
                                setShowSpinner(true)
                                fetchData(id, val!)
                            }
                        }]
                    }))
                    return
                }
                const { type, ...rest } = resp.data
                setScreenType(type)
                setListData(rest.list)
                if (rest.winner) {
                    setWinner(rest.winner)
                }
                if (type === 'paths') {
                    let newPlayerLoc: PlayerLoc = {}
                    rest.list.forEach((l: { team: string, players: { name: string, score: number }[] }) => {
                        if (l.team !== 'noteam') {
                            newPlayerLoc[l.team] = {}
                            l.players.forEach((p) => {
                                newPlayerLoc[l.team][p.name] = { display: 'Forked Path', name: 'path' }
                            })
                        }
                    })
                    setPlayerLoc(newPlayerLoc)
                    setGameAnswers(rest.answerList)
                }
                setPassword(password)
                setDialog((state) => ({ ...state, visible: false }))
            }).catch((e) => {
                console.log(e)
            }).finally(() => {
                setShowSpinner(false)
            })
    }, [])

    const startGame = useCallback(() => {
        setShowSpinner(true)
        fetch('/api/host/' + router.query.id, { body: JSON.stringify({ start: true }), method: 'POST', headers: { 'pathword-admin': password } })
            .then(response => response.json())
            .then(resp => {
                fetchData(router.query.id as string, password)
            })
    }, [router.query.id, fetchData, password])
    const endGame = useCallback(() => {
        setShowSpinner(true)
        fetch('/api/host/' + router.query.id, { body: JSON.stringify({ end: true }), method: 'POST', headers: { 'pathword-admin': password } })
            .then(response => response.json())
            .then(resp => {
                if (resp.data.end) {
                    setIsReady(false)
                    fetchData(router.query.id as string, password)
                    setTimeout(() => {
                        setScreenType('results')
                    }, 500)
                }
            })
    }, [router.query.id, fetchData, password])

    const removePlayer = useCallback((id: string, name: string) => {
        setShowSpinner(true)
        fetch('/api/host/' + router.query.id, { body: JSON.stringify({ removePlayer: id, playerName: name }), method: 'POST', headers: { 'pathword-admin': password } })
            .then((response) => response.json())
            .then(resp => {
                if (resp.success) {
                    fetchData(router.query.id as string, password)
                } else {
                    setShowSpinner(false)
                }
            })
    }, [password, router.query.id, fetchData])

    useEffect(() => {
        if (router.query.id) {
            setDialog({
                title: 'Enter Game Password for ' + router.query.id,
                input: true,
                visible: true,
                inputError: '',
                buttons: [{
                    text: 'Submit', reqInput: 1, callback: (val?: string) => {
                        setShowSpinner(true)
                        fetchData(router.query.id as string, val!)
                    }
                }]
            })
        }
    }, [router.query.id, fetchData])

    return (
        <>
            <Head>
                <title>Pathword Host</title>
                <meta name="description" content="Enter the correct password game" />
            </Head>
            <main>
                {screenType === 'lobby' && <HostLobby key="lobby" gameId={router.query.id as string} removePlayer={removePlayer} isReady={setIsReady} showSpinner={setShowSpinner} startGame={startGame} list={listData!} />}
                {screenType === 'paths' && <>
                    <h1 className={`${lucky.className} text-2xl mt-3 mb-6 text-center`}>Game #{router.query.id} Progress</h1>
                    <div className="flex gap-3 max-w-7xl m-auto justify-center">
                        {Object.entries(playerLoc).map(([t, p], idx) =>
                            <div key={`HostProgress-${idx}`} className="grow max-w-[50%]"><HostProgress setEnd={() => {
                                setIsReady(false)
                                fetchData(router.query.id as string, password)
                                setTimeout(() => {
                                    setScreenType('results')
                                }, 500)
                            }} gameId={router.query.id as string} team={t} playerLoc={p} gameAnswers={gameAnswers ? gameAnswers[t] : undefined} /></div>
                        )}
                    </div>
                    <div className="mt-4 text-center">
                        <button type="button" className={`text-lg bg-[--theme-2] p-2 pl-4 pr-4 mt-8 text-black rounded ${lucky.className}`} onClick={() => endGame()}>End Game</button>
                    </div>
                </>}
                {screenType === 'results' && <HostLobby key="results" gameId={router.query.id as string} isReady={setIsReady} showSpinner={setShowSpinner} winner={winner} list={listData!} />}
                <div className={`transition-all duration-500 fixed top-0 left-0 w-screen h-screen z-50 ${!isReady ? 'bg-black' : 'pointer-events-none'}`}></div>
            </main>
            <Dialog {...dialog} />
            <Spinner show={showSpinner} backdropType="black" />
        </>
    );
}

export default HostView;