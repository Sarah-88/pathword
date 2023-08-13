import { useEffect, useState } from 'react';
import { ReduxState } from '../lib/types';
import { useDispatch, useSelector } from 'react-redux'
import { Baloo_2, Luckiest_Guy, Macondo } from 'next/font/google';

type ResultsType = {
    gameId: string,
    isReady: (ready: boolean) => void,
    newGame: () => void
}

const baloo = Baloo_2({ subsets: ['latin'] })
const lucky = Luckiest_Guy({ subsets: ['latin'], weight: "400" })
const macondo = Macondo({ weight: "400", subsets: ['latin'] });

const Results = (props: ResultsType) => {
    const player = useSelector((state: ReduxState) => state.player)
    const [winner, setWinner] = useState('')
    const [results, setResults] = useState<{ team: string, players: { name: string, score: number }[] }[]>([])
    const { gameId, isReady } = props

    useEffect(() => {
        fetch('/api/game/' + gameId, { body: JSON.stringify({ room: 'results' }), method: 'POST' })
            .then(response => response.json())
            .then(resp => {
                if (resp.data?.winner) {
                    setResults(resp.data.teams)
                    setWinner(resp.data.winner)
                }
            }).finally(() => {
                isReady(true)
            })
    }, [gameId, isReady]);

    return (
        <div className="text-center">
            <h2 className={`mt-6 text-3xl uppercase ${lucky.className}`}>Winner: {winner === 'tie' ? 'Tie' : `Team ${winner}`}</h2>
            <div className="mt-5 flex justify-center gap-2">
                {results.map((r, k) =>
                    <div key={`team-${k}`} className={`${r.team === 'red' ? 'bg-red-700' : 'bg-blue-700'} max-w-sm p-5 w-2/5 rounded-3xl`}>
                        <h3 className={`${macondo.className} text-3xl pb-2 cursor-default`}>Team {r.team.replace(/./, (a) => a.toUpperCase())}</h3>
                        <ul>
                            {r.players.map((tr, i) =>
                                <li key={`player-r-${i}`} className={`${tr.name === player.name ? 'font-bold' : ''} bg-white mb-1 text-left p-1 pl-3 cursor-default flex justify-between pr-3 rounded-2xl text-gray-800 ${baloo.className}`}>
                                    <span>{tr.name}</span>
                                    <span>{tr.score}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
            <button type="button" className={`text-black text-xl mt-10 p-2 bg-[--theme-2] rounded-md pl-6 pr-6 ${lucky.className} hover:shadow-md`} onClick={() => props.newGame()}>Play Another Game</button>
        </div>
    );
};

export default Results;