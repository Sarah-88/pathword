import { Baloo_2, Luckiest_Guy, Macondo } from 'next/font/google'
import { useCallback, useEffect, useState } from 'react';
import { useChannel } from './AblyReactEffect';
import { ReduxState } from '../lib/types';
import { useDispatch, useSelector } from 'react-redux'
import { setGameProgress, setTeam } from '../redux/reducers/gameSlice';

const baloo = Baloo_2({ subsets: ['latin'] })
const lucky = Luckiest_Guy({ subsets: ['latin'], weight: "400" })
const macondo = Macondo({ weight: "400", subsets: ['latin'] });

type LobbyProps = {
    gameId: string,
    isReady: (ready: boolean) => void,
    showSpinner: (show: boolean) => void,
    backToHome: () => void
}

const TeamLobby = (props: LobbyProps) => {
    const dispatch = useDispatch()
    const { player, game } = useSelector((state: ReduxState) => ({ player: state.player, game: state.game }))
    const [teamlist, setTeamlist] = useState<Array<{ team: string, players: string[] }>>([])
    const { isReady, backToHome, gameId } = props

    const { channel } = useChannel(`lobby-${props.gameId}`, (message: { name: string, data: any }) => {
        if (message.name === 'joined-team' || message.name === 'leave-room') {
            setTeamlist((state) => {
                return state.map((t) => {
                    const playerList = [...t.players]
                    if (t.team === message.data.team && message.name === 'joined-team') {
                        if (!playerList.includes(message.data.player)) {
                            playerList.push(message.data.player)
                        }
                    } else {
                        const idx = t.players.findIndex(p => p === message.data.player)
                        if (idx > -1) {
                            playerList.splice(idx, 1)
                        }
                    }
                    return { ...t, players: playerList }
                })
            })
        } else if (message.name === 'game-start') {
            dispatch(setGameProgress({ stage: 'path' }))
        }
    });

    const getPlayers = useCallback(async () => await fetch('/api/game/' + gameId, { body: JSON.stringify({ room: 'lobby' }), method: 'POST' })
        .then(response => response.json())
        .then(resp => {
            if (!resp.data) {
                backToHome()
                return
            }
            setTeamlist(resp.data)
            channel.publish({
                name: "entered-lobby",
                data: {
                    player: player.name
                }
            });
        }).catch(e => {
            console.log(e)
            backToHome()
        }).finally(() => {
            isReady(true)
        })
        , [backToHome, isReady, gameId, channel, player.name])

    useEffect(() => {
        getPlayers()
    }, [getPlayers]);

    return (
        <div className="text-center">
            <h1 className={`${lucky.className} text-4xl mt-12 cursor-default`}>Welcome, {player.name}</h1>
            <h2 className={`${lucky.className} text-3xl mt-4 cursor-default`}>Choose Your Team</h2>
            <div className="flex min-h-[350px] justify-center gap-2 items-stretch m-auto mt-5">
                {teamlist?.map((tl, k) =>
                    <div key={`team-${k}`} className={`${tl.team === 'red' ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-700 hover:bg-blue-600'} max-w-xs p-5 w-2/5 rounded-3xl flex flex-col justify-between`}>
                        <h3 className={`${macondo.className} text-3xl pb-2 cursor-default`}>Team {tl.team.replace(/./, (a) => a.toUpperCase())}</h3>
                        <ul>
                            {tl.players.map((tr, i) => <li key={`player-r-${i}`} className={`bg-white mb-1 text-left p-1 pl-3 cursor-default pr-3 rounded-2xl text-gray-800 ${baloo.className}`}>
                                {tr}
                            </li>)}
                        </ul>
                        <button type="button" disabled={game.team === tl.team}
                            className={`${lucky.className} text-black text-xl p-2 bg-[--theme-2] rounded-md pl-6 pr-6 mt-auto ${game.team === tl.team ? 'grayscale' : ''}`}
                            onClick={() => {
                                props.showSpinner(true)
                                fetch('/api/game/players', {
                                    method: 'POST', body: JSON.stringify({
                                        gameId: props.gameId,
                                        playerId: player.id,
                                        team: tl.team,
                                        lastActive: new Date()
                                    })
                                })
                                    .then((response) => response.json())
                                    .then((resp) => {
                                        dispatch(setTeam(tl.team))
                                    }).finally(() => {
                                        props.showSpinner(false)
                                    })
                            }}>
                            Join{game.team === tl.team ? 'ed' : ''}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeamLobby;