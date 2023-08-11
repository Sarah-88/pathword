import { Baloo_2, Luckiest_Guy, Macondo } from 'next/font/google'
import { useEffect, useState } from 'react';
import { ReduxState } from '../lib/types';
import { useDispatch, useSelector } from 'react-redux'
import { setGameProgress, setPuzzles } from '../redux/reducers/gameSlice';

type LobbyType = {
    gameId: string,
    showSpinner: (show: boolean) => void,
    isReady: (ready: boolean) => void,
    backToHome: () => void
}

const baloo = Baloo_2({ subsets: ['latin'] })
const lucky = Luckiest_Guy({ subsets: ['latin'], weight: "400" })
const macondo = Macondo({ weight: "400", subsets: ['latin'] });

const PathLobby = (props: LobbyType) => {
    const dispatch = useDispatch()
    const game = useSelector((state: ReduxState) => state.game)
    const difficulty = ['easy', 'normal', 'hard']
    const [paths, setPaths] = useState<string[]>([])
    const [hints, setHints] = useState<{ [key: string]: Array<string> }>({})

    useEffect(() => {
        if (props.gameId && game.team && paths.length === 0) {
            fetch('/api/game/' + props.gameId, { body: JSON.stringify({ room: 'paths', team: game.team }), method: 'POST' })
                .then(response => response.json())
                .then((resp) => {
                    if (resp?.data?.branchReturn) {
                        setPaths(difficulty.filter(d => !!resp.data.branchReturn[d]))
                        setHints(resp.data.hints)
                        dispatch(setPuzzles(resp.data.branchReturn))
                    } else {
                        props.backToHome()
                    }
                }).catch((e) => {
                    console.log(e)
                    props.backToHome()
                }).finally(() => {
                    props.isReady(true)
                })
        }
    }, [props.gameId]);

    return (
        <div className="text-center">
            <h2 className={`${lucky.className} text-4xl mt-6`}>Choose Your Path</h2>
            <div className="flex h-[calc(100vh-200px)] max-h-[500px] justify-around max-w-5xl items-stretch m-auto mt-5">
                {paths.map((p, pi) =>
                    <div key={`branch-${pi}`} className={`border-8 p-2 border-[--theme-2] rounded-3xl min-w-[320px] bg-cover bg-center grayscale-[50%] hover:grayscale-0 flex flex-col justify-between`} style={{ backgroundImage: `url("/images/${p}1.png")` }}>
                        <div className="border border-[--theme-1] rounded-lg p-2 bg-[--theme-3-05]">
                            <h2 className={`text-xl uppercase ${macondo.className}`}>{p}</h2>
                        </div>
                        <div className={`border border-[--theme-1] pb-1 rounded-b-lg bg-[--theme-3-05] overflow-hidden text-left ${baloo.className}`}>
                            <p className="text-lg p-1 pl-2 pr-2 border-b border-[--theme-1] bg-yellow-400/70 text-black">Possible topics/puzzles</p>
                            <ul className="p-1 pl-2 pr-2 ml-1 mr-1 border border-[--theme-1] bg-white/20 rounded-md mt-1 list-disc list-inside">
                                {hints[p]?.map((h, i) => <li key={`branch-${p}-${i}`}>{h}</li>)}
                            </ul>
                            <button type="button" onClick={() => {
                                props.isReady(false)
                                setTimeout(() => {
                                    dispatch(setGameProgress({ path: p, stage: 'pathway', progress: 1 }))
                                }, 500)
                            }} className="bg-[--theme-5] ml-1 mr-1 p-2 w-[calc(100%-8px)] mt-1 text-xl rounded-lg border border-[--theme-3] outline-none">Enter</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PathLobby;