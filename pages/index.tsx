import { Baloo_2, Luckiest_Guy, Macondo } from 'next/font/google'
import Dialog from '../components/Dialog'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { ReduxState, DialogProps } from '../lib/types'
import { Spinner } from '../components/Spinner'
import { useDispatch, useSelector } from 'react-redux'
import { setPlayer } from '../redux/reducers/playerSlice'
import { resetGame, setGameId as saveGameId } from '../redux/reducers/gameSlice'
import Link from 'next/link'
import Head from 'next/head'

const baloo = Baloo_2({ subsets: ['latin'] })
const lucky = Luckiest_Guy({ subsets: ['latin'], weight: "400" })
const macondo = Macondo({ weight: "400", subsets: ['latin'] })

export default function Home() {
    const router = useRouter()
    const [showDialog, setShowDialog] = useState<DialogProps>({ visible: false, backdropType: 'blur', inputError: '' })
    const [isLoading, setIsLoading] = useState(false)
    const [gameId, setGameId] = useState('')
    const dispatch = useDispatch()
    const savedPlayer = useSelector((state: ReduxState) => state.player)
    const game = useSelector((state: ReduxState) => state.game)

    const checkGame = useCallback(async () => {
        setIsLoading(true)
        fetch('/api/game/' + gameId, { body: JSON.stringify({ room: 'game' }), method: 'POST' })
            .then(response => response.json())
            .then(resp => {
                if (resp.data?.exists) {
                    dispatch(resetGame())
                    setShowDialog((ssd) => ({
                        ...ssd,
                        visible: true,
                        desc: '',
                        title: 'Enter player name',
                        input: true,
                        inputPrep: savedPlayer?.name,
                        buttons: [
                            {
                                text: 'Cancel',
                                callback: () => {
                                    setShowDialog((state) => ({ ...state, visible: false }))
                                }
                            },
                            {
                                text: 'Enter',
                                reqInput: 2,
                                callback: async (value?: string) => {
                                    setIsLoading(true)
                                    const playerData = await fetch('/api/game/players', {
                                        method: 'POST', body: JSON.stringify({
                                            gameId: gameId,
                                            playerName: value,
                                            lastActive: new Date(),
                                            playerId: savedPlayer?.id
                                        })
                                    }).then(response => response.json())
                                    if (playerData.data) {
                                        dispatch(setPlayer({
                                            id: playerData.data.playerId,
                                            name: value
                                        }))
                                        dispatch(saveGameId(gameId))
                                        router.push('/play/' + gameId)
                                    } else {
                                        setShowDialog((state) => {
                                            return { ...state, inputError: playerData.message }
                                        })
                                        setTimeout(() => {
                                            setShowDialog((state) => {
                                                return { ...state, inputError: '' }
                                            })
                                        }, 3000)
                                    }
                                    setIsLoading(false)
                                }
                            }
                        ]
                    }))
                } else {
                    setShowDialog((ssd) => ({
                        ...ssd,
                        visible: true,
                        title: resp.message,
                        buttons: [
                            {
                                text: 'Ok', callback: () => {
                                    setShowDialog((state) => ({ ...state, visible: false }))
                                }
                            }
                        ]
                    }))
                }
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [gameId, savedPlayer, dispatch, router])

    useEffect(() => {
        if (game.gameId && game.stage !== 'lobby' && game.stage !== 'results') {
            setShowDialog((state) => ({
                ...state,
                visible: true,
                desc: `You have an ongoing game: ${game.gameId}. Continue this game?`,
                buttons: [
                    {
                        text: 'No',
                        callback: () => {
                            setShowDialog((ssd) => ({ ...ssd, visible: false }))
                        }
                    },
                    {
                        text: 'Yes',
                        callback: () => {
                            router.push('/play/' + game.gameId)
                        }
                    }
                ]
            }))
        }
    }, [game.gameId, game.stage, router])

    return (
        <>
            <Head>
                <title>Pathword</title>
                <meta name="description" content="Enter the correct password game" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <main className={baloo.className}>
                <h1 className={`text-center text-5xl mt-12 ${lucky.className}`}>Pathword</h1>
                <div className="flex items-center justify-center mt-12">
                    <div className="rounded-lg bg-yellow-50 p-5 shadow-box text-center">
                        <h2 className={`text-black ${macondo.className} text-2xl text-[--theme-5]`}>Enter Game ID</h2>
                        <input type="text" className="p-2 text-black rounded border uppercase border-[--theme-1] outline-none mt-2 bg-white" onChange={(e) => setGameId(e.target.value.toUpperCase())} />
                        <div className="mt-5">
                            <button type="button" className={`text-black text-xl p-2 bg-[--theme-2] rounded-md pl-6 pr-6 ${lucky.className} hover:shadow-md`} onClick={checkGame}>JOIN!</button>
                        </div>
                    </div>
                </div>
                <div className="mt-12 text-center">
                    <Link href={'/how-to-play'} className="text-[--theme-2] text-lg">How to play?</Link>
                </div>
                <Dialog {...showDialog} />
                <Spinner show={isLoading} backdropType="black" />
            </main>
        </>
    )
}
