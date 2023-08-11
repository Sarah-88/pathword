import { useEffect, useState } from 'react';
import { DialogObject, getDialog } from '../lib/utils';
import { DialogProps, ReduxState } from '../lib/types';
import Dialog from './Dialog';
import { useDispatch, useSelector } from 'react-redux'
import { addSolved, setGameProgress, setSolved } from '../redux/reducers/gameSlice';

type PathType = {
    gameId: string,
    showSpinner: (show: boolean) => void,
    isReady: (ready: boolean) => void,
    backToHome: () => void
}

const PathArea = (props: PathType) => {
    const dispatch = useDispatch()
    const game = useSelector((state: ReduxState) => state.game)
    const player = useSelector((state: ReduxState) => state.player)
    const [puzzle, setPuzzle] = useState<{ type: string, hint: string, display: string, required: boolean, image?: string, desc?: string, id?: string, solved?: boolean, lettersAvailable: string[], buttons: DialogProps['buttons'] }>()
    const [dialog, setDialog] = useState<{ text: string, buttons: DialogProps['buttons'] }>({ text: '', buttons: [] })
    const [openPuzzle, setOpenPuzzle] = useState(false)
    const [hasError, setError] = useState('')

    const formatButtons = (buttons: DialogObject['buttons'], extraParams?: { [key: string]: string }) => {
        return buttons.map((b) => {
            let toReturn: { text: string, reqInput?: number, callback: (val?: string) => void } = { text: b.text, callback: () => { } }
            switch (b.type) {
                case 'back':
                    toReturn['callback'] = () => {
                        props.isReady(false)
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
                    }
                    break
                case 'forward':
                    toReturn['callback'] = () => {
                        props.isReady(false)
                        setTimeout(() => {
                            // if (extraParams?.puzzleId && game.solved?[extraParams?.puzzleId]) {
                            //     let tmp = getDialog(`noPuzzle`)
                            //     setDialog({ ...tmp, buttons: formatButtons(tmp.buttons) })
                            //     console.log('setting new dialog')
                            // }
                            if (game.path && game.puzzles && game.puzzles[game.path].length <= game.progress) {
                                dispatch(setGameProgress({ stage: 'final' }))
                            } else {
                                dispatch(setGameProgress({ progress: game.progress + 1 }))
                            }
                        }, 500)
                    }
                    break
                case 'solve':
                    toReturn['callback'] = () => setOpenPuzzle(true)
                    break
                case 'submit':
                    toReturn['reqInput'] = extraParams?.display.length
                    toReturn['callback'] = async (val?: string) => {
                        if (!val || !extraParams?.puzzleId || val.length < extraParams?.display.length) {
                            return
                        }
                        props.showSpinner(true)
                        await fetch('/api/game/' + props.gameId, { method: 'POST', body: JSON.stringify({ answer: val, puzzleId: extraParams.puzzleId, playerId: player.id, playerName: player.name, team: game.team, room: 'checkAnswer' }) })
                            .then(response => response.json())
                            .then(resp => {
                                if (resp?.data?.correct) {
                                    setOpenPuzzle(false)
                                    let tmp = getDialog(`finishedPuzzle${resp.data.hasClue ? '' : 'NoClue'}`)
                                    setPuzzle((state) => {
                                        return { ...state!, solved: true }
                                    })
                                    dispatch(addSolved({ [extraParams.puzzleId]: player.id }))
                                    setDialog({ ...tmp, buttons: formatButtons(tmp.buttons) })
                                } else {
                                    setError(resp.message)
                                    setTimeout(() => {
                                        setError('')
                                    }, 5000)
                                }
                            }).finally(() => {
                                props.showSpinner(false)
                            })
                    }
                    break
            }
            return toReturn
        })
    }

    useEffect(() => {
        const pzId = game.puzzles[game.path][game.progress - 1].puzzleId
        if (game.solved && game.solved[pzId] !== player.id) {
            setOpenPuzzle(false)
            console.log('call others done?', game.solved)
            let tmp = getDialog(`otherFinished`)
            setDialog({ ...tmp, buttons: formatButtons(tmp.buttons, { puzzleId: pzId }) })
        }
    }, [game.solved, player, game.puzzles])

    useEffect(() => {
        if (props.gameId && !puzzle) {
            const pzId = game.puzzles[game.path][game.progress - 1].puzzleId
            if (game.solved && game.solved[pzId]) {
                let tmp = getDialog(`noPuzzle`)
                setDialog({ ...tmp, buttons: formatButtons(tmp.buttons) })
                props.isReady(true)
                return
            }
            fetch('/api/game/' + props.gameId, { body: JSON.stringify({ room: 'singlePath', puzzleId: pzId }), method: 'POST' })
                .then(response => response.json())
                .then((resp) => {
                    if (resp?.data?.solved) {
                        let tmp = getDialog(`noPuzzle`)
                        setDialog({ ...tmp, buttons: formatButtons(tmp.buttons) })
                        dispatch(addSolved({ [pzId]: 'unknown' }))
                    } else if (resp?.data) {
                        setPuzzle({
                            ...resp.data,
                            id: pzId,
                            solved: false,
                            buttons: formatButtons([{ type: 'cancel', text: 'Cancel' }, { type: 'submit', text: 'Submit' }], { ...resp.data, puzzleId: pzId })
                        })
                        let tmp = getDialog(`puzzle${resp.data.required ? 'Req' : 'Opt'}`)
                        setDialog({ ...tmp, buttons: formatButtons(tmp.buttons) })
                    } else {
                        props.backToHome()
                    }
                }).catch(e => {
                    props.backToHome()
                }).finally(() => {
                    props.isReady(true)
                })
        }
    }, []);

    return (
        <div className="text-center">
            <div className={`fixed left-0 top-0 w-screen h-screen bg-cover bg-center`} style={{ backgroundImage: `url(/images/${game.path}${game.progress % 4 + 1}.png)` }}></div>
            <Dialog visible={!!dialog.text && !openPuzzle} desc={dialog.text} buttons={dialog.buttons} />
            <Dialog visible={!!puzzle?.id && openPuzzle} desc={puzzle?.desc || puzzle?.hint} imageDisplay={puzzle?.image} large={true} inputError={hasError} availableLetters={puzzle?.lettersAvailable} textDisplay={puzzle?.display} buttons={puzzle?.buttons} />
        </div>
    );
};

export default PathArea;