"use client";
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import Image from "next/image";
import styles from "../styles/spinner.module.css";

// Memo: Do not re-render the component if props havent changed between re-renders
const MessageItem = memo(({ message, botPngFile, isLast }) => {
  /**
   * Render the chat message for user/bots, showing a profile picture.
   * Optionally, it can play audio clips or show source documents.
   *
   * Props:
   * - message: An object representing the chat message, which includes:
   *   - type: 'user' or 'bot'.
   *   - message: Message in text format
   *   - audio_file_url: (optional) A string URL to an audio file that can be played.
   *   - sourceDocuments: (optional) An array of document objects related to the message, each containing:
   *     - pageContent: The text content of the document.
   *     - metadata: An object containing metadata about the document.
   *
   * - botPngFile: A string specifying the filename of the bot's image to use from the `/assets/images` directory.
   *
   * - isLast: A boolean indicating if this is the last message in the chat sequence, which can affect styling.
   *
   * Example:
   * <MessageItem
   *   message={{
   *     type: "bot",
   *     message: "Hi, I'm your friendly assistant.",
   *     audio_file_url: "https://example.com/audio.mp3",
   *     sourceDocuments: [{
   *       pageContent: "Four score and seven years ago...",
   *       metadata: { created: "1863-11-19" }
   *     }]
   *   }}
   *   botPngFile="girlfriend"
   *   isLast={true}
   * />
   */

  const userImage = "/assets/images/green-square.png";
  const botImage = `/assets/images/${botPngFile}.png`;
  const [showSources, setShowSources] = useState(false);

  const playAudio = useCallback((audioUrl) => {
    /** Play an audio object from a given URL. Created on first render only. */
    const audio = new Audio(audioUrl);
    audio.play().catch((e) => console.error("Playback failed:", e));
    // console.log({ audioUrl });
  }, []);
  // console.log({ message });
  return (
    <div className={`flex flex-col ${isLast ? "flex-grow" : ""}`}>
      <div className="flex mb-4 w-full">
        <div className="rounded mr-4 h-10 w-10 relative overflow-hidden">
          <Image
            src={message.type === "user" ? userImage : botImage}
            alt={`${message.type}'s profile`}
            width={32}
            height={32}
            className="rounded"
            priority
            unoptimized
          />
        </div>
        <div className="flex justify-center align-middle gap-4">
          <p className={`max-w-96 ${message.type === "user" ? "user" : "bot"}`}>
            {message.message}
          </p>
          {message.audio_file_url && (
            // Repositioned the play button to be inline with the message, making it a part of the message flow
            <button
              onClick={() => playAudio(message.audio_file_url)}
              className="items-center rounded-full bg-gray-200 text-blue-500 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 h-8 w-8 text-center"
              aria-label="Play Audio"
            >
              🔊
            </button>
          )}
        </div>
      </div>

      {message.sourceDocuments && (
        <div className="mb-6">
          <button
            className="text-gray-600 text-sm font-bold"
            onClick={() => setShowSources(!showSources)}
          >
            Source Documents {showSources ? "(Hide)" : "(Show)"}
          </button>
          {showSources &&
            message.sourceDocuments.map((document, docIndex) => (
              <div key={docIndex}>
                <h3 className="text-gray-600 text-sm font-bold">
                  Source {docIndex + 1}:
                </h3>
                <p className="text-gray-800 text-sm mt-2">
                  {document.pageContent}
                </p>
                <pre className="text-xs text-gray-500 mt-2">
                  {JSON.stringify(document.metadata, null, 2)}
                </pre>
              </div>
            ))}
        </div>
      )}
    </div>
  );
});

const ChatMessages = ({ messages, botPngFile, maxMsgs, isLoadingMessages }) => {
  /**
   * 
   * The useRef hook in React is used to access a DOM element directly and persist values across renders without triggering a re-render of the component.

      In your ChatMessages component, useRef is used to create a ref object (messagesContainerRef) that is attached to the chat messages container DOM element. This allows your code to directly manipulate the DOM element.

      The useEffect hook in your code is used to scroll the container to the bottom every time the messages array changes, ensuring the latest message is visible. Here's how it works:

      1. A new message is added to the messages array, the component re-renders.
      2. The useEffect hook runs because its dependency array includes [messages].
      3. The useEffect hook accesses messagesContainerRef.current, which is the container div.
      4. It sets the `scrollTop` to the `scrollHeight` of the container -> scrolls to the bottom.
      
      There is no other way to directly manipulate the DOM for scrolling purposes in React's declarative paradigm. 
      The ref persists throughout the life of the component, allowing direct access to the DOM node without causing additional renders, which would happen if you were to use state for this purpose.
    */
  const messagesContainerRef = useRef();

  useEffect(() => {
    // On new message, scroll to the bottom.
    if (messagesContainerRef.current) {
      const element = messagesContainerRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  // E.g. If we have less than {5} messages, the messages won't take up the full container.
  //      We add the justify-end property to pushes messages to the bottom
  const maxMsgToScroll = maxMsgs || 5;
  return (
    <div
      ref={messagesContainerRef}
      className={`bg-white p-10 rounded-3xl shadow-lg mb-8 overflow-y-auto h-[500px] max-h-[500px] flex flex-col space-y-4 ${
        messages.length < maxMsgToScroll && "justify-end"
      }`}
    >
      {/* Show loading spinner only when isLoadingMessages is true */}
      {isLoadingMessages && (
        <div className="flex justify-center items-center h-full">
          <div className={styles.spinner}></div> {/* Use the spinner here */}
        </div>
      )}

      {/* Display messages if isLoadingMessages is false, regardless of messages count */}
      {!isLoadingMessages &&
        messages.map((message, index) => {
          // DEBUG: See every individual message
          // console.log({ message });
          return (
            <MessageItem
              // Ensuring unique key
              key={`idts-${message.ChatID}-${message.timestamp}`}
              message={message}
              botPngFile={botPngFile}
            />
          );
        })}
    </div>
  );
};
export default ChatMessages;
