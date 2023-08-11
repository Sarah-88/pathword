import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react';
import PathLobby from '../../components/PathLobby';
import PathArea from '../../components/PathArea';
import { useDispatch, useSelector } from 'react-redux'
import dynamic from 'next/dynamic';
import { ReduxState } from '../../lib/types';
import FinalArea from '../../components/FinalArea';
import { Spinner } from '../../components/Spinner';
import Results from '../../components/Results';
import { resetGame, setGameProgress } from '../../redux/reducers/gameSlice';

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
    const area = useMemo(() => {
        return formatArea(game.stage, game.path, game.progress)
    }, [game.stage, game.progress])
    const endGame = () => {
        setIsReady(false)
        setTimeout(() => {
            dispatch(setGameProgress({ stage: 'results' }))
        }, 500)
    }

    const getScreen = (stage?: string) => {
        switch (stage) {
            case "lobby":
                return <TeamLobby gameId={router.query.id as string} isReady={setIsReady} showSpinner={setShowSpinner} backToHome={backToHome} />
            case "path":
                return <PathLobby gameId={router.query.id as string} showSpinner={setShowSpinner} isReady={setIsReady} backToHome={backToHome} />
            case "final":
                return <FinalArea gameId={router.query.id as string} isReady={setIsReady} backToHome={backToHome} showSpinner={setShowSpinner} />
            case "pathway":
                return <PathArea key={`area-${game.path}-${game.progress}`} backToHome={backToHome} gameId={router.query.id as string} isReady={setIsReady} showSpinner={setShowSpinner} />
            case "results":
                return <Results gameId={router.query.id as string} isReady={setIsReady} newGame={backToHome} />
            default:
                return <></>
        }
    }

    const backToHome = () => {
        dispatch(resetGame())
    }

    useEffect(() => {
        if (!player || !player.id || !game.gameId) {
            router.push('/')
        }
    }, [router.query?.id, game])

    if (router.query.id?.length === 8) {
        return (
            <>
                <main className={`${['pathway', 'final', 'path'].includes(game.stage) ? 'pt-8' : ''}`}>
                    {getScreen(game.stage)}
                    {['pathway', 'final', 'path'].includes(game.stage) &&
                        <>
                            <div className="fixed top-0 left-0 right-0 z-30 bg-[--theme-1] border-b border-b-[--theme-2] p-2 flex gap-2 text-xs">
                                <span className="uppercase font-bold">{player.name}</span>
                                <span>&bull;</span>
                                <span className="uppercase">{game.team.toUpperCase()} Team</span>
                                <span>&bull;</span>
                                <span className="uppercase">Currently in <span className="text-[--theme-2]">{area.display}</span></span>
                            </div>
                            <GlobalChatComponent gameId={router.query.id as string} playerId={player.id} endGame={endGame} playerName={player.name} team={game.team} area={area} />
                        </>}
                    <div className={`transition-all duration-500 fixed top-0 left-0 w-screen h-screen z-50 ${!isReady ? 'bg-black' : 'pointer-events-none'}`}></div>
                    <Spinner show={showSpinner} backdropType="black" />
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