"use client";
import { useState, useEffect } from "react";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [chat, setChat] = useState(null);
  const [theme, setTheme] = useState("light");
  const [error, setError] = useState(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const MODEL_NAME = "gemini-1.5-flash"; // Adjust the model name as needed

  const genAI = new GoogleGenerativeAI(API_KEY);

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  useEffect(() => {
    const initChat = async () => {
      try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const newChat = await model.startChat({
          generationConfig,
          safetySettings,
          history: messages.map((msg) => ({
            text: msg.text,
            role: msg.role,
          })),
        });
        setChat(newChat);
      } catch (error) {
        console.error("Error initiating chat:", error); // Log detailed error
        setError("Failed to initiate chat. Try again");
      }
    };

    initChat();
  }, []);

  const handleSendMessage = async () => {
    try {
      const userMessage = {
        text: userInput,
        role: "user",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setUserInput("");

      if (chat) {
        const result = await chat.sendMessage(userInput);
        const botMessage = {
          text: result.response.text(),
          role: "bot",
          timestamp: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
    } catch (error) {
      setError("Failed to send message. Please try again.");
    }
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const getThemeColors = () => {
    switch (theme) {
      case "light":
        return {
          primary: "bg-gradient-to-r from-red-200 to-red-400",
          secondary: "bg-white",
          accent: "bg-red-700",
          text: "text-gray-800",
          bubbleBgUser: "bg-red-800",
        bubbleBgBot: "bg-gray-200",
        };
  
      case "dark":
        return {
          primary: "bg-gradient-to-r from-cyan-900 via-gray-800 to-gray-700", 
          secondary: "bg-gray-900",
          accent: "bg-cyan-00",
          text: "text-gray-500",
          bubbleBgUser: "bg-cyan-400",
        bubbleBgBot: "bg-gray-200",
        };
  
      default:
        return {
          primary: "bg-gradient-to-r from-red-200 to-red-400",
          secondary: "bg-white",
          accent: "bg-red-700",
          text: "text-gray-800",
          bubbleBgUser: "bg-red-800",
        bubbleBgBot: "bg-gray-200",
        };
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (text) => {
    const formattedText = text
      .split('\n')
      .map((line, i) => (
        <p key={i} className="mb-2">
          {line.split(/(\*\*.*?\*\*|_.*?_|`.*?`)/g).map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <span key={j} className="font-bold">{part.slice(2, -2)}</span>;
            } else if (part.startsWith('_') && part.endsWith('_')) {
              return <span key={j} className="italic">{part.slice(1, -1)}</span>;
            } else if (part.startsWith('`') && part.endsWith('`')) {
              return <span key={j} className="bg-gray-200 p-1 rounded text-sm font-mono">{part.slice(1, -1)}</span>;
            } else {
              return <span key={j}>{part}</span>;
            }
          })}
        </p>
      ));

    return formattedText;
  };

  const { primary, secondary, accent, text, bubbleBgUser, bubbleBgBot } = getThemeColors();

  return (
    <div className={`flex justify-center items-center h-screen p-4 ${primary}`}>
      <div className="w-full max-w-2xl h-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className={`flex flex-col h-full ${primary}`}>
          <div className="flex justify-between items-center mb-4 p-4 border-b">
            <h1 className={`text-2xl font-bold ${text}`}>Iris Chat </h1>
            <div className="flex space-x-2">
              <label htmlFor="theme" className={`text-sm ${text}`}>
                Theme:
              </label>
              <select
                id="theme"
                value={theme}
                onChange={handleThemeChange}
                className={`p-1 rounded-md border ${theme === "dark" ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
                  }`}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>

            </div>
          </div>

          <div className={`flex-1 overflow-y-auto ${secondary} rounded-md p-2`}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${msg.role === "user" ? `${bubbleBgUser} text-white` : `${bubbleBgBot} ${text}`
                    }`}
                >
                  {formatMessage(msg.text)}
                </span>
                <p className={`text-xs ${text} mt-1`}>
                  {msg.role === "bot" ? "Bot" : "You"} - {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>

          {error && <div className="text-red-500 text-sm mb-4 p-4 border-t">{error}</div>}

          <div className="flex items-center p-4 border-t">
            <input
              type="text"
              placeholder="Type your message..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className={`flex-1 p-2 rounded-md border focus:outline-none ${theme === "dark" ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
                }`}
            />

            <button
              onClick={handleSendMessage}
              className={`p-2 ${accent} text-white rounded-md ml-2 hover:bg-opacity-80 focus:outline-none`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
