import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect";
import styles from './AblyChatComponent.module.css';

const AblyChatComponent = () => {

  let inputBox: HTMLTextAreaElement | null = null;
  let messageEnd: HTMLDivElement | null = null;
  const [messageText, setMessageText] = useState("");
  const [receivedMessages, setMessages] = useState<Array<{connectionId: string, data: string}>>([]);
  const messageTextIsEmpty = messageText.trim().length === 0;

  const [channel, ably] = useChannel("chat-demo", (message: {connectionId: string, data: string}) => {
    // Here we're computing the state that'll be drawn into the message history
    // We do that by slicing the last 199 messages from the receivedMessages buffer

    const history = receivedMessages.slice(-199);
    setMessages([...history, message]);

    // Then finally, we take the message history, and combine it with the new message
    // This means we'll always have up to 199 message + 1 new message, stored using the
    // setMessages react useState hook
  });

  const sendChatMessage = (messageText: string) => {
    channel.publish({ name: "chat-message", data: messageText });
    setMessageText("");
    if (inputBox) {
      inputBox.focus();
    }
  }

  const handleFormSubmission = (event: React.FormEvent<HTMLElement>) => {
    event.preventDefault();
    sendChatMessage(messageText);
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.code !== 'Enter' || messageTextIsEmpty) {
      return;
    }
    sendChatMessage(messageText);
    event.preventDefault();
  }

  const messages = receivedMessages.map((message, index) => {
    
    const author = message.connectionId === ably.connection.id ? "me" : "other";
    return <span key={index} className={styles.message} data-author={author}>{message.data}</span>;
  });

  useEffect(() => {
    if (messageEnd) {
      messageEnd.scrollIntoView({ behavior: "smooth" });
    }
  });

  return (
    <div className={styles.chatHolder}>
      <div className={styles.chatText}>
        {messages}
        <div ref={(element) => { messageEnd = element; }}></div> // empty element to control scroll to bottom
      </div>
      <form onSubmit={handleFormSubmission} className={styles.form}>
        <textarea
          ref={(element) => { inputBox = element; }}
          value={messageText}
          placeholder="Type a message..."
          onChange={e => setMessageText(e.target.value)}
          onKeyUp={handleKeyPress}
          className={styles.textarea}
        ></textarea>
        <button type="submit" className={styles.button} disabled={messageTextIsEmpty}>Send</button>
      </form>
    </div>
  )  
}

export default AblyChatComponent;
