import { useCallback, useEffect, useRef, useState } from "react"
import { Baloo_2, Luckiest_Guy, Macondo } from 'next/font/google'
import { Puzzle, PuzzleRef } from "./Puzzle";
import { DialogProps } from "../lib/types";
import Image from "next/image";

const baloo = Baloo_2({ subsets: ['latin'] })
const lucky = Luckiest_Guy({ subsets: ['latin'], weight: "400" })
const macondo = Macondo({ weight: "400", subsets: ['latin'] });

const Dialog = (props: DialogProps) => {
    const [inputVal, setInputVal] = useState(props.inputPrep ?? '');
    const [puzzleAnswerReady, setPuzzleAnswerReady] = useState(false)
    const puzzleRef = useRef<PuzzleRef>(null)
    const handleContextMenu = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
        e.preventDefault()
    }, [])
    useEffect(() => {
        if (props.inputPrep !== undefined) {
            setInputVal(props.inputPrep)
        }
    }, [props.inputPrep])
    return (
        <div className={`absolute w-screen h-[calc(100vh-32px)] flex justify-center items-center z-40 top-8 left-0 transition-all ${props.visible ? (props.backdropType === 'blur' ? 'backdrop-blur' : props.backdropType === 'black' ? 'bg-black/70' : '') : 'pointer-events-none'}`}>
            <div className={`relative -mt-8 ${props.large ? 'w-full max-w-3xl' : 'min-w-[320px] max-w-lg'} shadow-box p-3 rounded-lg bg-yellow-50 text-center pb-12 transition-all ${props.visible ? 'top-0 opacity-100' : '-top-10 opacity-0 pointer-events-none'}`}>
                {props.title && <h3 className={`text-black text-2xl mb-3 ${macondo.className}`}>{props.title}</h3>}
                {props.imageDisplay && <div className="m-auto mb-3 max-w-xs text-center"><Image onContextMenu={handleContextMenu} src={props.imageDisplay} className="max-w-full" alt="Puzzle Image" /></div>}
                {props.desc && <p className={`text-black text-xl whitespace-pre-wrap mb-3 select-none ${baloo.className}`}>{props.desc}</p>}
                {props.subText && <p className={`text-black text-sm mb-3 ${baloo.className}`}>{props.subText}</p>}
                {props.textDisplay && <Puzzle ref={puzzleRef} clues={props.getClues} setReady={setPuzzleAnswerReady} incorrect={!!props.inputError} textDisplay={props.textDisplay} hintLetters={props.hintLetters?.revealed} disabledLetters={props.hintLetters?.disabled} availableLetters={props.availableLetters as string[]} />}
                {props.input && <>
                    <input type="text" defaultValue={props.inputPrep} onChange={(e) => {
                        setInputVal(e.target.value);
                    }} className="p-2 text-black rounded border border-[--theme-1] outline-none mb-3 bg-white" />
                    {props.inputError && <p className={`text-red-600 text-sm ${baloo.className}`}>{props.inputError}</p>}
                </>}
                {props.buttons?.length && <div className={`absolute top-[calc(100%-18px)] flex left-0 right-0 ${props.buttons.length === 1 ? 'justify-center' : 'justify-around'}`}>
                    {props.buttons.map((b, i) =>
                        <button key={`dbutton-${i}`} type="button" disabled={b.reqInput ? ((!inputVal || b.reqInput > inputVal.length) && (!props.textDisplay || !puzzleAnswerReady)) : false} onClick={() => {
                            if (b.reqInput && props.textDisplay) {
                                b.callback(puzzleRef?.current?.getAnswer())
                            } else {
                                b.callback(inputVal ? inputVal.trim() : undefined);
                            }
                        }} className={`shadow-[0_0_0_10px_var(--theme-2),0_0_3px_10px_var(--theme-2-dark)] p-2 pl-4 pr-4 bg-[--theme-5] tracking-wider rounded-md uppercase text-xl ${lucky.className} ${b.reqInput && ((!inputVal || inputVal.length < b.reqInput) && (!props.textDisplay || !puzzleAnswerReady)) ? 'grayscale' : 'hover:brightness-110'}`}>{b.text}</button>
                    )}
                </div>}
            </div>
        </div>
    )
}

export default Dialog;
