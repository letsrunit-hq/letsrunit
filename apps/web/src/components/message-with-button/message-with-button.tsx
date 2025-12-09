import React from 'react';

export type MessageWithButtonProps = {
  children: React.ReactNode;
  buttonText: string;
  onClick: () => void;
};

export function MessageWithButton({ children, buttonText, onClick }: MessageWithButtonProps) {
  return (
    <>
      {children}{' '}
      <button onClick={onClick} className="p-link p-0 font-medium text-sm underline ml-1">
        {buttonText}
      </button>
    </>
  );
}

export default MessageWithButton;
