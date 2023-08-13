import React, { ForwardedRef, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react"
import { letterList } from "../lib/utils"
import { Baloo_2, Caveat, Macondo } from "next/font/google"
import { useSelector } from "react-redux"
import { ReduxState } from "../lib/types"

type PuzzleProps = {
    availableLetters: string[]
    textDisplay: string,
    incorrect: boolean,
    clues?: boolean,
    setReady?: (ready: boolean) => void
}

const baloo = Baloo_2({ subsets: ['latin'] })
const macondo = Macondo({ subsets: ['latin'], weight: "400" })
const caveat = Caveat({ subsets: ['latin'] })

const getLetters = (available: string[]) => {
    return letterList.map((ll) => {
        const status = {
            letter: ll,
            available: true
        }
        if (!available?.includes(ll)) {
            status['available'] = false
        }
        return status
    })
}

export type PuzzleRef = {
    getAnswer: () => string
}

const findSelected = (toDisplay: string[][]) => {
    let innerIndex = -1
    const outerIndex = toDisplay.findIndex((td) => {
        innerIndex = td.findIndex(l => l === '_')
        if (innerIndex > -1) {
            return true
        }
        return false
    })
    return `${outerIndex}-${innerIndex}`
}

const PuzzleCom = (props: PuzzleProps, ref: ForwardedRef<PuzzleRef>) => {
    const [letters, setLetters] = useState(getLetters(props.availableLetters))
    const toDisplay = useMemo(() => props.textDisplay.split(' ').map(td => td.split('')), [props.textDisplay])
    const [selected, setSelected] = useState(findSelected(toDisplay))
    const [answer, setAnswer] = useState<{ [key: string]: string }>({})
    const [inputAnswer, setInputAnswer] = useState('')
    const clueList = useSelector((state: ReduxState) => state.game.clues)

    const selectAnswer = useCallback((letter: string) => {
        setAnswer((state) => {
            if (!letter) {
                const copy = { ...state }
                delete copy[selected]
                if (props.setReady) {
                    setTimeout(() => {
                        props.setReady && props.setReady(false)
                    }, 10)
                }
                return copy
            } else {
                const newState = { ...state, [selected]: letter }
                const toFill = props.textDisplay.split('').filter(a => a === '_').length
                const filled = Object.values(newState).length
                if (toFill <= filled && props.setReady) {
                    setTimeout(() => {
                        props.setReady && props.setReady(true)
                    }, 10)
                }
                return newState
            }

        })
        setSelected((state) => {
            const prev = state.split('-')
            const incr = letter ? 1 : -1
            let nextIdx = state
            //find next letter
            let startNum = Number(prev[1]) + incr
            outerLoop:
            for (let i = Number(prev[0]); i < toDisplay.length && i >= 0; i += incr) {
                for (let j = startNum; j < toDisplay[i].length && j >= 0; j += incr) {
                    if (toDisplay[i][j] === '_') {
                        nextIdx = `${i}-${j}`
                        break outerLoop
                    }
                }
                startNum = letter ? 0 : (toDisplay[i - 1] ? toDisplay[i - 1].length - 1 : 0)
            }
            return nextIdx
        })
    }, [props.setReady, props.textDisplay, selected, toDisplay])

    const typeAnswer = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (props.setReady) {
            setTimeout(() => {
                props.setReady && props.setReady(e.target.value.length >= props.textDisplay.length)
            }, 10)
        }
        setInputAnswer(e.target.value)
    }, [props.setReady, props.textDisplay])

    useImperativeHandle(ref, () => {
        return {
            getAnswer: () => {
                if (props.textDisplay !== '?') {
                    const words = toDisplay.map((td, ti) => {
                        const letters = td.map((l, i) => {
                            if (l === '_') {
                                return answer[`${ti}-${i}`]
                            }
                            return l
                        })
                        return letters.join('')
                    })
                    return words.join(' ')
                } else {
                    return inputAnswer
                }
            }
        }
    }, [answer, inputAnswer, props.textDisplay, toDisplay])

    useEffect(() => {
        setLetters(getLetters(props.availableLetters))
    }, [props.availableLetters])

    useEffect(() => {
        setSelected(findSelected(toDisplay))
    }, [toDisplay])

    useEffect(() => {
        const keyChange = (e: KeyboardEvent) => {
            //@ts-ignore
            if (e.target?.type === 'textarea') {
                return
            }
            if (props.availableLetters.includes(e.key.toUpperCase())) {
                selectAnswer(e.key.toUpperCase())
            } else if (e.code === 'Backspace') {
                selectAnswer('')
            }
        }

        document.addEventListener('keyup', keyChange)

        return () => document.removeEventListener('keyup', keyChange)
    })

    return <>
        <div className="pl-7 pr-7">
            {toDisplay.map((td, ti) => (
                <React.Fragment key={`word-${ti}`}>
                    <div className="align-top inline-block whitespace-nowrap mr-4">
                        {td.map((l, i) =>
                            <div key={`wletter-${ti}-${i}`}
                                className={`${l === '_' ? 'border-b-2 border-b-[--theme-1] min-w-[28px] mr-[1px] ml-[1px]' : ''} ${selected === `${ti}-${i}` ? 'bg-[--theme-3-05]' : ''} ${baloo.className} text-4xl mb-2 inline-block align-top text-black h-10`}
                            >
                                {l === '_'
                                    ? <button type="button" className={`w-full h-full outline-none ${props.incorrect ? 'text-red-600' : ''}`} onClick={() => {
                                        setSelected(`${ti}-${i}`)
                                    }}>{answer[`${ti}-${i}`]}</button>
                                    : l.toUpperCase()
                                }
                            </div>
                        )}
                    </div>
                    {[',', '.', ';'].includes(td[td.length - 1]) ? <br /> : ''}
                </React.Fragment>
            ))}
        </div>
        <div className="mt-5">
            {props.textDisplay === '?' ?
                <div className="pl-4 pr-4"><input type="text" className={`bg-white text-black border border-[--theme-1] text-2xl rounded outline-none p-2 w-full ${baloo.className}`} onChange={typeAnswer} /></div>
                : (letters.map((l, i) =>
                    <button
                        key={`button-letter-${i}`}
                        type="button"
                        disabled={!l.available}
                        className={`mr-2 mb-2 pl-2 pr-2 rounded text-3xl outline-none border border-[--theme-1] ${baloo.className} ${!l.available ? 'bg-[--theme-3]' : 'bg-white text-black shadow-button hover:bg-yellow-50'}`}
                        onClick={() => {
                            selectAnswer(l.letter)
                        }}
                    >
                        {l.letter}
                    </button>
                ))}
        </div>
        {props.clues &&
            <div className="mt-3">
                <h3 className={`text-2xl text-black ${macondo.className}`}>Clues</h3>
                <div className="mt-2 flex gap-1 justify-center flex-wrap">
                    {clueList?.map((c, i) =>
                        <div key={`clue-${i}`} className={`pl-2 pr-2 text-2xl shadow-md border border-gray-100 bg-white select-none text-black ${caveat.className}`}>{c}</div>
                    )}
                </div>
            </div>
        }
    </>
}

export const Puzzle = forwardRef(PuzzleCom)