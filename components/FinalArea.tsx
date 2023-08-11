import { useEffect, useMemo, useState } from 'react';
import { DialogObject, getDialog, getRandom, letterList } from '../lib/utils';
import { DialogProps, ReduxState } from '../lib/types';
import Dialog from './Dialog';
import { useDispatch, useSelector } from 'react-redux'
import { setGameProgress, setFailed, setClues } from '../redux/reducers/gameSlice';

type FinalAreaType = {
    gameId: string,
    showSpinner: (show: boolean) => void,
    isReady: (ready: boolean) => void,
    backToHome: () => void
}

const FinalArea = (props: FinalAreaType) => {
    const dispatch = useDispatch()
    const game = useSelector((state: ReduxState) => state.game)
    const player = useSelector((state: ReduxState) => state.player)
    const [openPuzzle, setOpenPuzzle] = useState(false)
    const [textDisplay, setTextDisplay] = useState('')
    const bg = useMemo(() => getRandom(1, 2), [])
    const [dialog, setDialog] = useState<{ text: string, buttons: DialogProps['buttons'] }>()

    const formatButtons = (buttons: DialogObject['buttons'], extraParams?: { [key: string]: string }) => {
        return buttons.map((b) => {
            let toReturn: { text: string, reqInput?: number, callback: (val?: string) => void } = { text: b.text, callback: () => { } }
            switch (b.type) {
                case 'back':
                    toReturn['callback'] = () => {
                        props.isReady(false)
                        setTimeout(() => {
                            dispatch(setGameProgress({ stage: 'pathway' }))
                        }, 500)
                    }
                    break
                case 'cancel':
                    toReturn['callback'] = () => {
                        setOpenPuzzle(false)
                    }
                    break
                case 'finish':
                    toReturn['callback'] = () => {
                        props.isReady(false)
                        setTimeout(() => {
                            dispatch(setGameProgress({ stage: 'results' }))
                        }, 500)
                    }
                    break
                case 'solve':
                    toReturn['callback'] = () => setOpenPuzzle(true)
                    break
                case 'submit':
                    toReturn['reqInput'] = extraParams?.display.length
                    toReturn['callback'] = async (val?: string) => {
                        props.showSpinner(true)
                        await fetch('/api/game/' + props.gameId, { method: 'POST', body: JSON.stringify({ password: val, room: 'checkPassword', team: game.team, playerName: player.name, playerId: player.id }) })
                            .then(response => response.json())
                            .then(resp => {
                                if (resp.data.success) {
                                    const dl = getDialog('endGame')
                                    setDialog({
                                        ...dialog,
                                        text: dl.text,
                                        buttons: formatButtons(dl.buttons)
                                    })
                                } else {
                                    const dl = getDialog('failGame')
                                    setDialog({
                                        ...dialog,
                                        text: dl.text,
                                        buttons: formatButtons(dl.buttons)
                                    })
                                    dispatch(setFailed())
                                }
                            }).finally(() => {
                                props.showSpinner(false)
                                setOpenPuzzle(false)
                            })
                    }
                    break
            }
            return toReturn
        })
    }

    useEffect(() => {
        if (game.failed) {
            const dl = getDialog('alreadyFail')
            setDialog({
                ...dialog,
                text: dl.text,
                buttons: formatButtons(dl.buttons)
            })
            props.isReady(true)
        } else {
            const dl = getDialog('finalPassword')
            setDialog({
                text: dl.text,
                buttons: formatButtons(dl.buttons)
            })
            fetch('/api/game/' + props.gameId, { body: JSON.stringify({ room: 'password', team: game.team }), method: 'POST' })
                .then(response => response.json())
                .then(resp => {
                    if (resp.data.display) {
                        dispatch(setClues(resp.data.clues))
                        setTextDisplay(resp.data.display)
                    } else {
                        props.backToHome()
                    }
                }).catch(e => {
                    console.log(e)
                    props.backToHome()
                }).finally(() => {
                    props.isReady(true)
                })
        }
    }, []);

    return (
        <div className="text-center">
            <div className={`fixed left-0 top-0 w-screen h-screen bg-cover bg-center`} style={{ backgroundImage: `url(/images/final${bg}.png)` }}></div>
            <Dialog visible={!!dialog?.text && !openPuzzle} desc={dialog?.text} buttons={dialog?.buttons} />
            <Dialog visible={openPuzzle} title={'What is the password?'} getClues={true} availableLetters={letterList} large={true} textDisplay={textDisplay}
                buttons={formatButtons([
                    { type: 'cancel', text: 'Cancel' },
                    { type: 'submit', text: 'Submit' }
                ], { display: textDisplay })} />
        </div>
    );
};

export default FinalArea;