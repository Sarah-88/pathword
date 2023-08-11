import { Baloo_2, Luckiest_Guy, Macondo } from 'next/font/google'
import { useMemo, useState } from 'react'
import Dialog from '../../components/Dialog'
import { useRouter } from 'next/router'
import { DialogProps } from '../../lib/types'

export const difficulty = ['easy', 'normal', 'hard'] as const
type BranchType = { enabled: boolean, clues: string[], maxPath: number, minPath: number }
type Difficulty = typeof difficulty[number]

const baloo = Baloo_2({ subsets: ['latin'] })
const lucky = Luckiest_Guy({ subsets: ['latin'], weight: "400" })
const macondo = Macondo({ weight: "400", subsets: ['latin'] });
// const AblyChatComponent = dynamic(() => import('../components/AblyChatComponent'), { ssr: false });



export default function Game() {
    const router = useRouter()
    const [adminPassword, setAdminPassword] = useState('');
    const [password, setPassword] = useState('');
    const [branches, setBranches] = useState<{ [key in Difficulty]: BranchType }>(() => {
        //@ts-ignore
        let tmp: { [key in Difficulty]: BranchType } = {}
        difficulty.forEach(d => {
            tmp[d] = { enabled: true, clues: [], maxPath: 1, minPath: 1 }
        })
        return tmp
    });
    const [tmpText, setTmpText] = useState<{ [key in Difficulty]: string }>({ easy: '', normal: '', hard: '' })
    const [processing, setProcessing] = useState(false);
    const enabled = useMemo(() => {
        return Object.values(branches).filter(b => b.enabled).length > 0
    }, [branches])
    const [dialog, setDialog] = useState<DialogProps>({ backdropType: 'black', visible: false })

    const addClue = (d: Difficulty) => () => {
        if (tmpText[d].length) {
            setBranches((state) => ({ ...state, [d]: { ...state[d], clues: [...state[d].clues, tmpText[d]], minPath: state[d].clues.length + 1, maxPath: Math.max(state[d].maxPath, state[d].clues.length + 1) } }))
            setTmpText({ ...tmpText, [d]: '' })
        }
    }

    return (
        <>
            <div className={`${baloo.className} pb-5`}>
                <h1 className={`text-center text-4xl mt-12 ${lucky.className}`}>Create Game</h1>
                <div className="grid mt-12 max-w-xl grid-cols-[1fr_2fr] gap-3 m-auto items-start">
                    <label>
                        Admin Password
                        <p className="mt-1 text-xs">To ensure only the owner can access the host page</p>
                    </label>
                    <input type="text" className="bg-white text-black rounded border-0 p-1 outline-none" onChange={(e) => setAdminPassword(e.target.value)} />
                    <label>
                        Game Password
                        <p className="mt-1 text-xs">The word(s) players must guess at the end of the game</p>
                    </label>
                    <input type="text" className="bg-white text-black rounded border-0 p-1 outline-none" onChange={(e) => setPassword(e.target.value)} />
                    <label>
                        Branches
                        <p className="mt-1 text-xs">
                            Paths players can take. Add clues to each path for players to earn, and order the clues by most important to least important. Those most important clues would be needed to guess your game password.
                            The number of letters in the password is a clue that will always be given in the most difficult path available (an extra puzzle will be added).
                        </p>
                    </label>
                    <div>
                        {difficulty.map((d, i) =>
                            <div key={`branch-${d}`} className="mb-2 pb-3 border-b border-b-gray-500">
                                <label className="font-bold"><input type="checkbox" className="align-middle mr-1" checked={branches[d].enabled} onChange={(e) => {
                                    setBranches((state) => {
                                        return { ...state, [d]: { ...state[d], enabled: e.target.checked } }
                                    })
                                }} />{d}</label>
                                {branches[d].enabled && (
                                    <div className="border border-gray-500 mt-2 p-2 grid grid-cols-[1fr_2fr] gap-2 items-center justify-start">
                                        <label className="whitespace-nowrap">Max puzzles</label>
                                        <input type="number" value={branches[d].maxPath} className="text-black bg-white rounded border-0 p-1 outline-none w-10" min={branches[d].minPath} max={99} onChange={(e) => {
                                            setBranches((state) => {
                                                return { ...state, [d]: { ...state[d], maxPath: Number(e.target.value) } }
                                            })
                                        }} />
                                        <label className="self-start mt-1">Clues</label>
                                        <div>
                                            {branches[d].clues.map((c, idx) =>
                                                <div key={`clue-${idx}`} className="select-none inline-block align-middle mr-1 bg-gray-800 border border-gray-600 p-1 text-sm mb-1">
                                                    {c}
                                                    <button type="button" className="text-sm ml-1 inline-block" onClick={() => {
                                                        setBranches((state) => {
                                                            let tmp = [...state[d].clues]
                                                            tmp.splice(idx, 1)
                                                            return { ...state, [d]: { ...state[d], clues: tmp, minPath: tmp.length, maxPath: Math.max(state[d].maxPath, tmp.length) } }
                                                        })
                                                    }}>&times;</button>
                                                </div>
                                            )}
                                            <div className="flex">
                                                <input type="text" value={tmpText[d]} className="p-1 outline-none text-black bg-white rounded border-0" onKeyUp={(e) => {
                                                    if (e.code === 'Enter') {
                                                        addClue(d)()
                                                    }
                                                }} onChange={(e) => {
                                                    setTmpText({ ...tmpText, [d]: e.target.value })
                                                }} />
                                                <button type="button" className="whitespace-nowrap bg-[--theme-5] rounded ml-1 pl-1 pr-1 border border-gray-500" onClick={addClue(d)}>Add as Clue</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="max-w-xl m-auto">
                    <button type="submit" disabled={!password || !adminPassword || !enabled || processing} className={`bg-[--theme-2] p-3 pl-5 pr-5 block mt-12 w-full rounded-xl text-black text-xl uppercase ${password && adminPassword && enabled && !processing ? '' : 'grayscale'}`} onClick={(e) => {
                        e.preventDefault();
                        setProcessing(true);
                        fetch('/api/host/create', {
                            method: 'POST',
                            body: JSON.stringify({
                                password,
                                adminPassword,
                                branches
                            })
                        })
                            .then(response => response.json())
                            .then(resp => {
                                console.log(resp);
                                if (resp.data.success) {
                                    navigator.clipboard.writeText(resp.data.gameId)
                                    setDialog({
                                        ...dialog,
                                        visible: true,
                                        title: 'Created Game',
                                        desc: 'Your game ID is ' + resp.data.gameId,
                                        subText: 'The game ID has been copied to clipboard',
                                        buttons: [
                                            {
                                                text: 'Go to Game Host Room', callback: () => {
                                                    router.push('/host/' + resp.data.gameId)
                                                }
                                            }
                                        ]
                                    })
                                }
                            }).finally(() => {
                                setProcessing(false);
                            })
                    }}>Create</button>
                </div>
            </div>
            <Dialog {...dialog} />
        </>
    )
}
