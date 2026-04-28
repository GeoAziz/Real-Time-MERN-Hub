/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from '../../client/src/components/messages/MessageInput.jsx';
import { SocketContext } from '../../client/src/context/SocketContext.jsx';
import useConversation from '../../client/src/zustand/useConversation.js';

const mockSendMessage = jest.fn();
const mockSocket = { emit: jest.fn(), on: jest.fn(), off: jest.fn() };

jest.mock('../../client/src/hooks/useSendMessage.js', () => ({
  __esModule: true,
  default: () => ({ loading: false, sendMessage: mockSendMessage }),
}));

jest.mock('../../client/src/zustand/useConversation.js', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('MessageInput', () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
    useConversation.mockReturnValue({ selectedConversation: { _id: 'conv-1' } });
  });

  it('sends a text message', async () => {
    const user = userEvent.setup();
    render(
      <SocketContext.Provider value={{ socket: mockSocket, onlineUsers: [] }}>
        <MessageInput />
      </SocketContext.Provider>
    );

    await user.type(screen.getByPlaceholderText(/send a message/i), 'hello');
    await user.click(screen.getByRole('button'));

    expect(mockSendMessage).toHaveBeenCalledWith({ message: 'hello', file: null });
  });
});
