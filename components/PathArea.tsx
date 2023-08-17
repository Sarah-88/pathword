import { useCallback, useEffect, useState } from 'react';
import { DialogObject, getDialog } from '../lib/utils';
import { DialogProps, ReduxState } from '../lib/types';
import Dialog from './Dialog';
import { useDispatch, useSelector } from 'react-redux'
import { addSolved, setGameProgress, setSolved } from '../redux/reducers/gameSlice';
import { setScore } from '../redux/reducers/playerSlice';

type PathType = {
    gameId: string,
    showSpinner: (show: boolean) => void,
    isReady: (ready: boolean) => void,
    backToHome: () => void,
    allowHint: (allow: boolean) => void
}

const PathArea = (props: PathType) => {
    const dispatch = useDispatch()
    const game = useSelector((state: ReduxState) => state.game)
    const player = useSelector((state: ReduxState) => state.player)
    const [puzzle, setPuzzle] = useState<{ type: string, hint: string, display: string, required: boolean, image?: string, desc?: string, id?: string, solved?: boolean, lettersAvailable: string[], buttons: DialogProps['buttons'] }>()
    const [dialog, setDialog] = useState<{ text: string, buttons: DialogProps['buttons'] }>({ text: '', buttons: [] })
    const [openPuzzle, setOpenPuzzle] = useState(false)
    const [hasError, setError] = useState('')
    const { isReady, backToHome, gameId, showSpinner, allowHint } = props

    const formatButtons = useCallback((buttons: DialogObject['buttons'], extraParams?: { [key: string]: string }) => {
        return buttons.map((b) => {
            let toReturn: { text: string, reqInput?: number, callback: (val?: string) => void } = { text: b.text, callback: () => { } }
            switch (b.type) {
                case 'back':
                    toReturn['callback'] = () => {
                        isReady(false)
                        setTimeout(() => {
                            if (game.progress - 1 === 0) {
                                dispatch(setGameProgress({ stage: 'path', path: '' }))
                            } else {
                                dispatch(setGameProgress({ progress: game.progress - 1 }))
                            }
                        }, 500)
                    }
                    break
                case 'cancel':
                    toReturn['callback'] = () => {
                        setOpenPuzzle(false)
                        allowHint(false)
                    }
                    break
                case 'forward':
                    toReturn['callback'] = () => {
                        isReady(false)
                        setTimeout(() => {
                            if (game.puzzles[game.path].length <= game.progress) {
                                dispatch(setGameProgress({ stage: 'final' }))
                            } else {
                                dispatch(setGameProgress({ progress: game.progress + 1 }))
                            }
                        }, 500)
                    }
                    break
                case 'solve':
                    toReturn['callback'] = () => {
                        setOpenPuzzle(true)
                        allowHint(true)
                    }
                    break
                case 'submit':
                    toReturn['reqInput'] = extraParams?.display.length
                    toReturn['callback'] = async (val?: string) => {
                        if (!val || !extraParams?.puzzleId || val.length < extraParams?.display.length) {
                            return
                        }
                        showSpinner(true)
                        await fetch('/api/game/' + gameId, { method: 'POST', body: JSON.stringify({ answer: val, puzzleId: extraParams.puzzleId, playerId: player.id, playerName: player.name, team: game.team, room: 'checkAnswer' }) })
                            .then(response => response.json())
                            .then(resp => {
                                if (resp?.data?.correct) {
                                    setOpenPuzzle(false)
                                    allowHint(false)
                                    let tmp = getDialog(`finishedPuzzle${resp.data.hasClue ? '' : 'NoClue'}`)
                                    setPuzzle((state) => {
                                        return { ...state!, solved: true }
                                    })
                                    dispatch(addSolved({ [extraParams.puzzleId]: player.id }))
                                    dispatch(setScore(resp.data.score))
                                    setDialog({ ...tmp, buttons: formatButtons(tmp.buttons) })
                                } else {
                                    setError(resp.message)
                                    setTimeout(() => {
                                        setError('')
                                    }, 5000)
                                }
                            }).finally(() => {
                                showSpinner(false)
                            })
                    }
                    break
            }
            return toReturn
        })
    }, [gameId, player, isReady, dispatch, game.path])

    const firstLoad = useCallback(() => {
        const puzzleId = game.puzzles[game.path][game.progress - 1].puzzleId
        if (gameId && puzzleId) {
            if (game.solved && game.solved[puzzleId]) {
                let tmp = getDialog(`noPuzzle`)
                setDialog({ ...tmp, buttons: formatButtons(tmp.buttons) })
                setPuzzle({ id: puzzleId, solved: true, hint: '', display: '', required: false, type: '', lettersAvailable: [], buttons: [] })
                isReady(true)
                return
            }
            fetch('/api/game/' + gameId, { body: JSON.stringify({ room: 'singlePath', puzzleId: puzzleId }), method: 'POST' })
                .then(response => response.json())
                .then((resp) => {
                    if (resp?.data?.solved) {
                        let tmp = getDialog(`noPuzzle`)
                        setDialog({ ...tmp, buttons: formatButtons(tmp.buttons) })
                        dispatch(addSolved({ [puzzleId]: 'unknown' }))
                    } else if (resp?.data) {
                        setPuzzle({
                            ...resp.data,
                            id: puzzleId,
                            solved: false,
                            buttons: formatButtons([{ type: 'cancel', text: 'Cancel' }, { type: 'submit', text: 'Submit' }], { ...resp.data, puzzleId: puzzleId })
                        })
                        let tmp = getDialog(`puzzle${resp.data.required ? 'Req' : 'Opt'}`)
                        setDialog({ ...tmp, buttons: formatButtons(tmp.buttons) })
                    } else {
                        backToHome()
                    }
                }).catch(e => {
                    backToHome()
                }).finally(() => {
                    isReady(true)
                })
        }
    }, [gameId, game.path, game.progress, dispatch])

    useEffect(() => {
        if (game.solved && game.solved[puzzle?.id!] && game.solved[puzzle?.id!] !== player.id) {
            setOpenPuzzle(false)
            allowHint(false)
            let tmp = getDialog(`otherFinished`)
            setDialog({ ...tmp, buttons: formatButtons(tmp.buttons, { puzzleId: puzzle?.id! }) })
        }
    }, [game.solved, player])

    useEffect(() => {
        firstLoad()
    }, [firstLoad]);

    return (
        <div className="text-center">
            <div className={`absolute left-0 top-0 w-screen h-screen bg-cover bg-center`} style={{ backgroundImage: `url(/images/${game.path}${game.progress % 4 + 1}.png)` }}></div>
            <Dialog visible={!!dialog.text && !openPuzzle} desc={dialog.text} buttons={dialog.buttons} />
            <Dialog visible={!!puzzle?.id && openPuzzle} desc={puzzle?.desc || puzzle?.hint} hintLetters={game.hint ? game.hint[puzzle?.id!] : undefined} imageDisplay={puzzle?.image} large={true} inputError={hasError} availableLetters={puzzle?.lettersAvailable} textDisplay={puzzle?.display} buttons={puzzle?.buttons} />
        </div>
    );
};

export default PathArea;