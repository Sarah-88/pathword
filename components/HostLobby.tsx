import { Baloo_2, Luckiest_Guy, Macondo } from 'next/font/google'
import { useEffect, useState } from 'react';
import { useChannel } from './AblyReactEffect';

const baloo = Baloo_2({ subsets: ['latin'] })
const lucky = Luckiest_Guy({ subsets: ['latin'], weight: "400" })
const macondo = Macondo({ weight: "400", subsets: ['latin'] });

type LobbyProps = {
    gameId: string,
    list: { team: string, players: { name: string, score: number }[] }[],
    winner?: string,
    startGame?: () => void,
    isReady: (ready: boolean) => void,
    showSpinner: (show: boolean) => void,
}

const HostLobby = (props: LobbyProps) => {
    const [teamlist, setTeamlist] = useState(props.list)

    if (!props.winner) {
        useChannel(`lobby-${props.gameId}`, (message: { name: string, data: any }) => {
            console.log('received message', message)
            if (message.name === 'joined-team' || message.name === 'leave-room' || message.name === 'entered-lobby') {
                setTeamlist((state) => {
                    let processedPlayer = false
                    return state.map((t) => {
                        const playerList = [...t.players]
                        if (t.team === message.data.team && message.name === 'joined-team') {
                            processedPlayer = true
                            playerList.push({ name: message.data.player, score: 0 })
                        } else {
                            const idx = t.players.findIndex(p => p.name === message.data.player)
                            if (idx > -1 && message.name !== 'entered-lobby') {
                                playerList.splice(idx, 1)
                                processedPlayer = true
                            }
                        }
                        if (t.team === 'noteam' && !processedPlayer) {
                            const exists = playerList.find(p => p.name === message.data.player)
                            if (!exists) {
                                playerList.push({ name: message.data.player, score: 0 })
                            }
                        }
                        return { ...t, players: playerList }
                    })
                })
            }
        });
    }

    useEffect(() => {
        setTeamlist(props.list)
        props.isReady(true)
    }, [props.list])

    return (
        <div className="text-center">
            <h1 className={`${lucky.className} text-3xl mt-12 cursor-default`}>Game #{props.gameId}{props.winner ? ' Results' : ''}</h1>
            {props.winner && <h2 className={`${lucky.className} text-xl mt-4 cursor-default`}>Winner: {props.winner === 'tie' ? 'Tie' : `Team ${props.winner}`}</h2>}
            <div className="flex min-h-[350px] justify-center gap-2 items-stretch m-auto mt-5">
                {teamlist.map((tl, k) =>
                    <div key={`team-${k}`} className={
                        `${tl.team === 'red' ? 'bg-red-700 hover:bg-red-600' : tl.team === 'blue' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} 
                            max-w-xs p-5 w-2/5 rounded-3xl flex flex-col`
                    }>
                        <h3 className={`${macondo.className} text-3xl pb-2 cursor-default`}>{tl.team === 'noteam' ? 'Unassigned' : `Team ${tl.team.replace(/./, (a) => a.toUpperCase())}`}</h3>
                        <ul>
                            {tl.players.map((tr, i) => <li key={`player-r-${i}`} className={`bg-white mb-1 p-1 pl-3 flex justify-between cursor-default pr-3 rounded-2xl text-gray-800 ${baloo.className}`}>
                                {tr.name}
                                {props.winner && <span>{tr.score}</span>}
                            </li>)}
                        </ul>
                    </div>
                )}
            </div>
            {props.startGame && <button type="button" className={`text-lg bg-[--theme-2] p-2 pl-4 pr-4 mt-8 text-black rounded ${lucky.className}`} onClick={() => {
                props.startGame && props.startGame()
            }}>Start Game</button>}
        </div>
    );
}

export default HostLobby;