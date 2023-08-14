import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useChannel } from "./AblyReactEffect";
import { Baloo_2 } from 'next/font/google';
import { ChatData, ReduxState } from '../lib/types';
import { useDispatch, useSelector } from 'react-redux';
import { addClue, addSolved, setSolved } from '../redux/reducers/gameSlice';

type ChatComponentProps = {
    gameId: string,
    playerName: string,
    playerId: string,
    area: { name: string, display: string },
    team: string,
    endGame?: () => void
}

const baloo = Baloo_2({ subsets: ['latin'] })

const GlobalChatComponent = (props: ChatComponentProps) => {
    const game = useSelector((state: ReduxState) => state.game)
    const dispatch = useDispatch()
    const inputBox = useRef<HTMLTextAreaElement>(null)
    const messageEnd = useRef<HTMLDivElement>(null);
    const [messageText, setMessageText] = useState("");
    const [receivedMessages, setMessages] = useState<ChatData[]>([]);

    const { channel } = useChannel(`chat-${props.gameId}-${props.team}`, (message: { name: string, data: ChatData }) => {
        if (['joined-team', 'leave-room', 'game-start'].includes(message.name)) {
            return
        }
        setMessages((state) => {
            const msg = [...state].slice(-199)
            return [...msg, { ...message.data }]
        })
        if (messageEnd?.current) {
            setTimeout(() => {
                messageEnd.current?.scrollIntoView({ behavior: "smooth" });
            }, 10)
        }
        if (message.name === 'success-password') {
            setTimeout(() => {
                props.endGame && props.endGame()
            }, 10000)
        } else if (message.name === 'get-clue' && message.data.extra?.clue) {
            dispatch(addClue(message.data.extra?.clue))
        } else if (message.name === 'enter' && message.data.extra?.solved) {
            if (game.solved && Object.keys(game.solved).length < Object.keys(message.data.extra.solved).length) {
                dispatch(setSolved(message.data.extra.solved))
            }
        }
    });

    const sendChatMessage = useCallback((messageText: string) => {
        channel.publish({ name: `chat`, data: { author: props.playerName, id: props.playerName, text: messageText, area: props.area } });
        setMessageText('');
        if (inputBox?.current) {
            inputBox.current.focus();
        }
    }, [channel, inputBox, props.playerName, props.area])

    const handleFormSubmission = useCallback((event: React.FormEvent<HTMLElement>) => {
        event.preventDefault();
        sendChatMessage(messageText);
    }, [messageText, sendChatMessage])

    const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
        if (event.code !== 'Enter' || messageText.trim().length === 0) {
            return;
        }
        sendChatMessage(messageText);
        event.preventDefault();
    }, [messageText, sendChatMessage])

    useEffect(() => {
        channel.publish({
            name: `enter`,
            data: {
                text: `${props.playerName} has entered ${props.area.display}.`,
                id: props.playerName, area: props.area,
                extra: { solved: game.solved }
            }
        });
    }, [props.area, channel, props.playerName]);

    return (
        <div className={`absolute bottom-0 right-0 border border-white/30 w-[280px] z-50 ${baloo.className}`}>
            <div className="p-2 bg-[--theme-5] border-b border-b-white">
                <span>Chat Log</span>
            </div>
            <div className="p-2 bg-[--theme-3-08] text-sm overflow-auto max-h-52 min-h-[100px]">
                {receivedMessages.map((msg, i) =>
                    <div key={`msg-${i}`} className="mb-1">
                        {msg.author && <span className={`${msg.author === props.playerName ? 'text-yellow-200' : msg.area.name === 'HostRoom' ? 'text-red-300' : ''} mr-1`}>
                            {msg.author}{msg.area.name !== 'HostRoom' && <span className="text-orange-300"> [{msg.area.display}]</span>}:
                        </span>}
                        <span className={!msg.author ? 'italic' : ''}>{msg.text}</span>
                    </div>
                )}
                <div ref={messageEnd}></div>
            </div>
            <form onSubmit={handleFormSubmission} className="p-1 border-t border-t-white bg-[--theme-5] flex w-full">
                <textarea
                    ref={inputBox}
                    value={messageText}
                    placeholder="Chat to the team..."
                    onChange={e => setMessageText(e.target.value)}
                    onKeyUp={handleKeyPress}
                    rows={2}
                    className={`bg-white text-black text-sm pl-1 pr-1 grow min-h-[40px] rounded-l outline-none resize-none ${baloo.className}`}
                ></textarea>
                <button type="submit" className={`bg-[--theme-2] rounded-r p-1 uppercase text-black pl-2 pr-2 ${baloo.className}`} disabled={messageText.trim().length === 0}>Send</button>
            </form>
        </div>
    )
}

export default GlobalChatComponent;
