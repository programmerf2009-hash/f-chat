import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string) => boolean;
  onTyping: () => void;
}

export function Composer({ disabled, onSend, onTyping }: ComposerProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 140)}px`;
  };

  const send = () => {
    if (disabled) return;
    if (onSend(value)) {
      setValue('');
      requestAnimationFrame(() => {
        resize();
        textareaRef.current?.focus();
      });
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className="composer-input"
        rows={1}
        value={value}
        placeholder="Xabar yozing... (Enter — yuborish, Shift+Enter — yangi qator)"
        onChange={(event) => {
          setValue(event.target.value);
          resize();
          if (event.target.value.trim()) onTyping();
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={2000}
      />
      <button className="send-btn" type="submit" disabled={disabled || !value.trim()} aria-label="Yuborish">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.2 2-12.2 2z" fill="currentColor" />
        </svg>
      </button>
    </form>
  );
}
