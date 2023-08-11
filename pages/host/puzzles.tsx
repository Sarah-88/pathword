import { Baloo_2, Luckiest_Guy, Macondo } from 'next/font/google'
import { useState } from 'react'

const baloo = Baloo_2({ subsets: ['latin'] })
const lucky = Luckiest_Guy({ subsets: ['latin'], weight: "400" })
const macondo = Macondo({ weight: "400", subsets: ['latin'] });

export default function Puzzle() {
    const [difficulty, setDifficulty] = useState('easy');
    const [type, setType] = useState('blanks');
    const [hint, setHint] = useState('');
    const [question, setQuestion] = useState('');
    const [image, setImage] = useState('');
    const [answer, setAnswer] = useState('');
    const [processing, setProcessing] = useState(false);

    const changeRadio = (type: 'difficulty' | 'type', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            if (type === 'type') {
                setType(e.target.value);
            } else {
                setDifficulty(e.target.value);
            }
        }
    }
    return (
        <>
            <form action="" method="POST" className={baloo.className}>
                <h1 className={`text-center text-6xl mt-12 ${lucky.className}`}>Create Puzzle</h1>
                <div className="grid mt-12 max-w-xl grid-cols-[1fr_2fr] gap-3 m-auto items-center">
                    <label>Difficulty</label>
                    <div className="flex justify-between">
                        <div>
                            <input id="easy" type="radio" name="difficulty" defaultChecked={true} onChange={(e) => changeRadio('difficulty', e)} className="align-middle" value="easy" />
                            <label htmlFor="easy" className="ml-2 align-middle">Easy</label>
                        </div>
                        <div>
                            <input id="normal" type="radio" name="difficulty" onChange={(e) => changeRadio('difficulty', e)} className="align-middle" value="normal" />
                            <label htmlFor="normal" className="ml-2 align-middle">Normal</label>
                        </div>
                        <div>
                            <input id="hard" type="radio" name="difficulty" onChange={(e) => changeRadio('difficulty', e)} className="align-middle" value="hard" />
                            <label htmlFor="hard" className="ml-2 align-middle">Hard</label>
                        </div>
                    </div>
                    <label>Type</label>
                    <div className="flex justify-between">
                        <div>
                            <input id="blanks" type="radio" name="type" defaultChecked={true} onChange={(e) => changeRadio('type', e)} className="align-middle" value="blanks" />
                            <label htmlFor="blanks" className="ml-2 align-middle">Fill the blanks</label>
                        </div>
                        <div>
                            <input id="riddle" type="radio" name="type" onChange={(e) => changeRadio('type', e)} className="align-middle" value="riddle" />
                            <label htmlFor="riddle" className="ml-2 align-middle">Riddle</label>
                        </div>
                        <div>
                            <input id="rebus" type="radio" name="type" onChange={(e) => changeRadio('type', e)} className="align-middle" value="rebus" />
                            <label htmlFor="rebus" className="ml-2 align-middle">Rebus</label>
                        </div>
                    </div>
                    <label>Hint (Optional)</label>
                    <input type="text" className="bg-white text-black rounded border-0 p-1 outline-none" onChange={(e) => setHint(e.target.value)} />
                    {type === 'riddle' && <>
                        <label>Question (For Riddles)</label>
                        <textarea className="bg-white text-black rounded border-0 p-1 outline-none resize-y" onChange={(e) => setQuestion(e.target.value)} />
                    </>}
                    {type === 'rebus' && <>
                        <label>Image</label>
                        <input type="file" className="p-1" accept="image/*" onChange={(e) => {
                            const reader = new FileReader()
                            reader.addEventListener('load', () => {
                                setImage(reader.result as string)
                                console.log(reader.result)
                            }, false)
                            if (e.target.files?.length === 1) {
                                reader.readAsDataURL(e.target.files[0])
                            }
                        }} />
                    </>}
                    <label>Answer</label>
                    <input type="text" className="bg-white text-black rounded border-0 p-1 outline-none" onChange={(e) => setAnswer(e.target.value)} />
                </div>
                <div className="max-w-xl m-auto">
                    <button type="submit" disabled={!answer || processing} className={`bg-[--theme-2] p-3 pl-5 pr-5 block mt-12 w-full rounded-xl text-black text-xl uppercase ${answer && !processing ? '' : 'grayscale'}`} onClick={(e) => {
                        e.preventDefault();
                        setProcessing(true);
                        let obj: { [key: string]: string } = {
                            difficulty,
                            type,
                            answer,
                            hint
                        }
                        if (type === 'riddle') {
                            obj['longText'] = question
                        } else if (type === 'rebus') {
                            obj['image'] = image
                        }
                        fetch('/api/puzzles', {
                            method: 'POST',
                            body: JSON.stringify(obj)
                        })
                            .then(response => response.json())
                            .then(resp => {
                                console.log(resp);
                                setProcessing(false);
                            })
                    }}>Create</button>
                </div>
            </form>
        </>
    )
}
