import { useState, useEffect, useRef } from "react";

interface Message {
  username: string;
  text: string;
  timestamp: string;
}

function App() {
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const url = import.meta.env.VITE_API_URL;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Trigger when messages array changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  };

  useEffect(() => {
    let user = localStorage.getItem("username");
    if (user) {
      setUsername(user);
    } else {
      user = prompt("Make a username...");
      setUsername(user!);
      localStorage.setItem("username", user!);
    }
    const connect = () => {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const message: Message = JSON.parse(event.data);
          setMessages((prev) => [...prev, message]);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.current.onclose = () => {
        console.log("WebSocket closed");
        setIsConnected(false);
        // Optional: Implement reconnection logic here
      };
    };

    connect();

    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = () => {
    if (newMessage.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const message: Message = {
        username: username,
        text: newMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, message]);
      ws.current.send(JSON.stringify(message));
      setNewMessage("");
    }
  };

  return (
    <div className="chat-app">
      <div className="title-bar">
        <img src="/open-chat.png" alt="open chat logo" />
        <h1>Open Chat</h1>
      </div>
      <div className="messages">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`${
                msg.username === username ? "my-message" : "message"
              }`}
            >
              <div className="text">{msg.text}</div>
              <div className="timestamp">
                {msg.username}{" "}
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="msg-txt">
            <p>Start the conversation</p>
          </div>
        )}
        {/* Empty div for auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          type="text"
          value={newMessage}
          placeholder="Type your text..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewMessage(e.target.value)
          }
          onKeyPress={(e: React.KeyboardEvent) =>
            e.key === "Enter" && sendMessage()
          }
          disabled={!isConnected}
          autoFocus
        />
        <button onClick={sendMessage} disabled={!isConnected}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
