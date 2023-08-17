import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react';
import PathLobby from '../../components/PathLobby';
import PathArea from '../../components/PathArea';
import { useDispatch, useSelector } from 'react-redux'
import dynamic from 'next/dynamic';
import { ReduxState } from '../../lib/types';
import FinalArea from '../../components/FinalArea';
import { Spinner } from '../../components/Spinner';
import Results from '../../components/Results';
import { addHint, resetGame, setGameProgress } from '../../redux/reducers/gameSlice';
import Head from 'next/head';
import Dialog from '../../components/Dialog';
import { resetScore, setScore } from '../../redux/reducers/playerSlice';

const TeamLobby = dynamic(() => import('../../components/TeamLobby'), { ssr: false });
const GlobalChatComponent = dynamic(() => import('../../components/GlobalChatComponent'), { ssr: false })

export const formatArea = (stage: string, path: string, progress: number) => {
    let area = { name: stage, display: "" }
    switch (stage) {
        case "path":
            area.display = "Forked Pathway"
            break
        case "final":
            area.display = "Path's End"
            break
        case "pathway":
            area.display = path.replace(/./, (a) => a.toUpperCase()) + " Path, Stage " + progress
            area.name += `-${path}-${progress}`
            break
    }
    return area
}

const Paths = () => {
    const router = useRouter()
    const player = useSelector((state: ReduxState) => state.player)
    const game = useSelector((state: ReduxState) => state.game)
    const dispatch = useDispatch()
    const [isReady, setIsReady] = useState(false)
    const [showSpinner, setShowSpinner] = useState(false)
    const [allowHint, setAllowHint] = useState(false)
    const [showHintDialog, setShowHintDialog] = useState(false)
    const area = useMemo(() => {
        return formatArea(game.stage, game.path, game.progress)
    }, [game.stage, game.progress, game.path])
    const endGame = useCallback(() => {
        setIsReady(false)
        setTimeout(() => {
            dispatch(resetScore())
            dispatch(setGameProgress({ stage: 'results' }))
        }, 500)
    }, [dispatch])

    const backToHome = useCallback(() => {
        dispatch(resetScore())
        dispatch(resetGame())
    }, [dispatch])

    const getScreen = useCallback((stage?: string) => {
        switch (stage) {
            case "lobby":
                return <TeamLobby gameId={router.query.id as string} isReady={setIsReady} showSpinner={setShowSpinner} backToHome={backToHome} />
            case "path":
                return <PathLobby gameId={router.query.id as string} showSpinner={setShowSpinner} isReady={setIsReady} backToHome={backToHome} />
            case "final":
                return <FinalArea gameId={router.query.id as string} isReady={setIsReady} backToHome={backToHome} showSpinner={setShowSpinner} />
            case "pathway":
                return <PathArea key={`area-${game.path}-${game.progress}`} backToHome={backToHome} allowHint={setAllowHint} gameId={router.query.id as string} isReady={setIsReady} showSpinner={setShowSpinner} />
            case "results":
                return <Results gameId={router.query.id as string} isReady={setIsReady} newGame={backToHome} />
            default:
                return <></>
        }
    }, [router.query.id, backToHome, game.path, game.progress])

    const applyHint = useCallback(() => {
        const puzzleId = game.puzzles[game.path][game.progress - 1].puzzleId
        fetch('/api/game/' + router.query?.id, {
            method: 'POST', body: JSON.stringify({
                room: 'getHint',
                team: game.team,
                playerId: player.id,
                path: game.path,
                progress: game.progress,
                exist: game.hint && game.hint[puzzleId] ? game.hint[puzzleId].revealed : {}
            })
        })
            .then(response => response.json())
            .then(resp => {
                if (resp.data) {
                    const gameHint = game.hint && game.hint[puzzleId] ? JSON.parse(JSON.stringify(game.hint[puzzleId])) : { disabled: [], revealed: {} }
                    if (resp.data.disableLetter) {
                        gameHint.disabled.push(resp.data.disableLetter)
                    }
                    gameHint.revealed[resp.data.letterIndex] = resp.data.revealedLetter
                    dispatch(addHint({ [puzzleId]: gameHint }))
                    dispatch(setScore(resp.data.score))
                }
            })
        setShowHintDialog(false)

    }, [router.query?.id, game.hint, game.team, game.path, game.progress, player.id])

    useEffect(() => {
        if (!player || !player.id || !game.gameId) {
            router.push('/')
        }
    }, [router.query?.id, game.gameId, player, router])

    if (router.query.id?.length === 8) {
        return (
            <>
                <Head>
                    <title>Pathword - #{game.gameId}</title>
                    <meta name="description" content="Enter the correct password game" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                </Head>
                <main className={`${['pathway', 'final', 'path'].includes(game.stage) ? 'pt-8' : ''}`}>
                    {getScreen(game.stage)}
                    {['pathway', 'final', 'path'].includes(game.stage) &&
                        <>
                            <div className="fixed top-0 left-0 right-0 z-30 bg-[--theme-1] border-b border-b-[--theme-2] flex gap-2 text-xs justify-between items-center">
                                <div className="p-2 flex gap-2">
                                    <span className="uppercase font-bold">{player.name}</span>
                                    <span>&bull;</span>
                                    <span className="uppercase">{game.team} Team</span>
                                    <span>&bull;</span>
                                    <span className="uppercase">Currently in {formatArea(game.stage, game.path, game.progress).display}</span>
                                </div>
                                <div className="flex gap-3 p-2">
                                    {allowHint && game.stage === 'pathway' &&
                                        <button type="button" className="hover:text-yellow-200 relative z-40" onClick={() => setShowHintDialog(true)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="hover:text-yellow-200" viewBox="0 0 32 32">
                                                <path d="M20 24.75h-8c-0.69 0-1.25 0.56-1.25 1.25v2c0 0 0 0 0 0 0 0.345 0.14 0.658 0.366 0.885l2 2c0.226 0.226 0.538 0.365 0.883 0.365 0 0 0.001 0 0.001 0h4c0 0 0.001 0 0.002 0 0.345 0 0.657-0.14 0.883-0.365l2-2c0.226-0.226 0.365-0.538 0.365-0.883 0-0.001 0-0.001 0-0.002v0-2c-0.001-0.69-0.56-1.249-1.25-1.25h-0zM18.75 27.482l-1.268 1.268h-2.965l-1.268-1.268v-0.232h5.5zM25.377 6.358c-1.919-3.252-5.328-5.447-9.263-5.644l-0.027-0.001h-0.071c-3.934 0.165-7.338 2.292-9.274 5.423l-0.028 0.049c-1.17 1.687-1.869 3.777-1.869 6.031 0 0.012 0 0.025 0 0.037v-0.002c0.184 2.294 0.923 4.383 2.081 6.176l-0.032-0.052c0.322 0.555 0.664 1.102 1.006 1.646 0.671 0.991 1.314 2.13 1.862 3.322l0.062 0.151c0.194 0.455 0.637 0.768 1.153 0.768 0 0 0.001 0 0.001 0h-0c0.173-0 0.338-0.035 0.489-0.099l-0.008 0.003c0.455-0.194 0.768-0.638 0.768-1.155 0-0.174-0.036-0.34-0.1-0.49l0.003 0.008c-0.669-1.481-1.374-2.739-2.173-3.929l0.060 0.095c-0.327-0.523-0.654-1.044-0.962-1.575-0.939-1.397-1.557-3.083-1.71-4.901l-0.003-0.038c0.019-1.735 0.565-3.338 1.485-4.662l-0.018 0.027c1.512-2.491 4.147-4.17 7.185-4.332l0.022-0.001h0.052c3.071 0.212 5.697 1.934 7.162 4.423l0.023 0.042c0.864 1.293 1.378 2.883 1.378 4.593 0 0.053-0 0.107-0.002 0.16l0-0.008c-0.22 1.839-0.854 3.496-1.807 4.922l0.026-0.041c-0.287 0.487-0.588 0.968-0.889 1.446-0.716 1.066-1.414 2.298-2.020 3.581l-0.074 0.175c-0.067 0.148-0.106 0.321-0.106 0.503 0 0.69 0.56 1.25 1.25 1.25 0.512 0 0.952-0.308 1.146-0.749l0.003-0.008c0.625-1.33 1.264-2.452 1.978-3.52l-0.060 0.096c0.313-0.498 0.625-0.998 0.924-1.502 1.131-1.708 1.891-3.756 2.12-5.961l0.005-0.058c0.003-0.098 0.005-0.213 0.005-0.329 0-2.184-0.654-4.216-1.778-5.91l0.025 0.040zM15.139 5.687c-0.199-0.438-0.633-0.737-1.136-0.737-0.188 0-0.365 0.041-0.525 0.116l0.008-0.003c-2.463 1.415-4.215 3.829-4.711 6.675l-0.008 0.057c-0.011 0.061-0.017 0.132-0.017 0.204 0 0.617 0.447 1.129 1.035 1.231l0.007 0.001c0.063 0.011 0.135 0.018 0.209 0.018h0c0.615-0.001 1.126-0.446 1.23-1.031l0.001-0.008c0.366-2.067 1.575-3.797 3.252-4.852l0.030-0.017c0.437-0.2 0.735-0.634 0.735-1.138 0-0.187-0.041-0.364-0.115-0.523l0.003 0.008z"></path>
                                            </svg>
                                        </button>}
                                    <span className="uppercase">{player.score ?? 0} points</span>
                                </div>
                            </div>
                            <GlobalChatComponent gameId={router.query.id as string} playerId={player.id} endGame={endGame} playerName={player.name} team={game.team} area={area} />
                        </>}
                    <div className={`transition-all duration-500 fixed top-0 left-0 w-screen h-screen z-50 ${!isReady ? 'bg-black' : 'pointer-events-none'}`}></div>
                    <Dialog backdropType='black' visible={showHintDialog} title="Reveal a random letter?" desc="This will deduct 1 point from your score." buttons={[{ text: 'No', callback: () => setShowHintDialog(false) }, { text: 'Yes', callback: () => applyHint() }]} />
                    <Spinner show={showSpinner} backdropType="blur" />
                </main>
            </>
        )
    } else {
        return (
            <div></div>
        )
    }
}

export default Paths;