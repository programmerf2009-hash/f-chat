import { ChatScreen } from './components/ChatScreen';
import { LoginScreen } from './components/LoginScreen';
import { useChat } from './hooks/useChat';

export default function App() {
  const chat = useChat();

  if (!chat.me) {
    return <LoginScreen busy={chat.status === 'connecting'} error={chat.authError} onSubmit={chat.login} />;
  }

  return <ChatScreen chat={chat} />;
}
