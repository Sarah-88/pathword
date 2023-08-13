import { Baloo_2, Luckiest_Guy, Macondo } from 'next/font/google'
import { useCallback, useEffect, useRef, useState } from 'react';
import { GameType, DialogProps, ChatData, PlayerLoc } from '../lib/types';
import { useSelector } from 'react-redux';
import { useChannel } from './AblyReactEffect';

const baloo = Baloo_2({ subsets: ['latin'] })
const lucky = Luckiest_Guy({ subsets: ['latin'], weight: "400" })
const macondo = Macondo({ weight: "400", subsets: ['latin'] });

type HostProgressProps = {
    playerLoc: PlayerLoc[0],
    gameId: string,
    team: string,
    gameAnswers?: { [key: string]: { display?: string, answer: string, hint?: string } },
    setEnd: () => void
}

const HostProgress = (props: HostProgressProps) => {
    const [playerLoc, setPlayerLoc] = useState(props.playerLoc)
    const [messages, setMessages] = useState<ChatData[]>([])
    const [typedMsg, setTypedMsg] = useState('')
    const [playerFail, setPlayerFail] = useState<string[]>([])
    const messageEnd = useRef<HTMLDivElement>(null)
    const inputBox = useRef<HTMLTextAreaElement>(null)
    const receiveNotification = useCallback((type: string, msg: ChatData) => {
        switch (type) {
            case 'enter':
                setPlayerLoc((state) => {
                    return { ...state, [msg.id]: { display: msg.area.display, name: msg.area.name } }
                })
                break
            case 'success-password':
                setTimeout(() => {
                    props.setEnd()
                }, 10000)
                break
            case 'fail-password':
                setPlayerFail((state) => [...state, msg.id])
                break
        }
    }, [props.setEnd])

    const { channel } = useChannel(`chat-${props.gameId}-${props.team}`, (message: { name: string, data: ChatData }) => {
        setMessages((state) => {
            let msg = [...state].slice(-199)
            return [...msg, message.data]
        })
        if (message.name !== 'chat') {
            receiveNotification(message.name, message.data)
        }
        if (messageEnd?.current) {
            setTimeout(() => {
                messageEnd.current?.scrollIntoView({ behavior: "smooth" });
            }, 10)
        }
    });

    const sendChatMessage = useCallback((messageText: string) => {
        channel.publish({ name: `chat`, data: { author: 'Game Host', id: 'Host', text: messageText, area: { name: 'HostRoom', display: 'Host\s Domain' } } });
        setTypedMsg('');
        if (inputBox) {
            inputBox.current?.focus();
        }
    }, [inputBox, channel])

    const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
        if (event.code !== 'Enter' || typedMsg.trim().length === 0) {
            return;
        }
        sendChatMessage(typedMsg);
        event.preventDefault();
    }, [sendChatMessage, typedMsg])

    useEffect(() => {
        setPlayerLoc(props.playerLoc)
    }, [props.playerLoc, setPlayerLoc])

    return (
        <>
            <h2 className={`text-xl uppercase text-center pb-2 ${macondo.className}`}>{props.team} Team</h2>
            <div className={`flex bg-slate-700 ${baloo.className}`}>
                <ul className="grow">
                    {Object.entries(playerLoc)?.map(([p, l], idx) =>
                        <li key={`playerloc-${idx}`} className={`p-2 border-b border-b-gray-900 ${idx > 0 ? 'border-t-gray-600' : ''}`}>
                            {p}
                            {playerFail.includes(p) && <span className="inline-block align-middle ml-1">&#128128;</span>}
                            <span className="group ml-1 inline-block align-middle bg-slate-300 text-black text-sm rounded-xl pl-2 pr-2 select-none relative">
                                {l.display}
                                {props.gameAnswers && props.gameAnswers[l.name] && <span className="absolute top-full mt-1 rounded p-1 left-0 hidden group-hover:block bg-gray-200">
                                    {props.gameAnswers[l.name].display && <>
                                        <span className="text-orange-700 font-bold block">{props.gameAnswers[l.name].hint}</span>
                                        {props.gameAnswers[l.name].display}<br />
                                    </>}
                                    {props.gameAnswers[l.name].answer}
                                </span>}
                            </span>
                        </li>
                    )}
                </ul>
                <div className="border border-[--theme-3] w-[300px]">
                    <div className="bg-[--theme-5] p-2 border-b border-b-[--theme-2]">Chat Log</div>
                    <div className="bg-[--theme-3-05] p-2 text-sm overflow-auto min-h-[200px] max-h-[calc(100vh-200px)]">
                        {messages.map((msg, i) =>
                            <div key={`msg-${i}`} className="mb-1">
                                {msg.author && <span className="mr-1">
                                    {msg.author}{msg.area.name !== 'HostRoom' && <span className="text-orange-300"> [{msg.area.display}]</span>}:
                                </span>}
                                <span className={!msg.author ? 'italic' : ''}>{msg.text}</span>
                            </div>
                        )}
                        <div ref={messageEnd}></div>
                    </div>
                    <div className="bg-[--theme-5] border-t border-t-[--theme-2] p-1 flex">
                        <textarea
                            placeholder="Chat to the team..."
                            ref={inputBox}
                            value={typedMsg}
                            onChange={e => setTypedMsg(e.target.value)}
                            onKeyUp={handleKeyPress}
                            rows={2}
                            className={`bg-white text-black text-sm pl-1 pr-1 grow min-h-[40px] rounded-l outline-none resize-none ${baloo.className}`}>
                        </textarea>
                        <button type="button" className="uppercase bg-[--theme-2] p-1 rounded-r text-black">Send</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HostProgress;