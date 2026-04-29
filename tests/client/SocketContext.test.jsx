/** @jest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react';
import { AuthContext } from '../../client/src/context/AuthContext.jsx';
import { useSocketContext } from '../../client/src/context/SocketContext.js';
import { SocketContextProvider } from '../../client/src/context/SocketContextProvider.jsx';

const mockSocket = { on: jest.fn(), close: jest.fn() };

jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: jest.fn(() => mockSocket),
}));

const Status = () => {
  const { socket } = useSocketContext();
  return <div>{socket ? 'connected' : 'disconnected'}</div>;
};

describe('SocketContextProvider', () => {
  beforeEach(() => {
    localStorage.setItem('chat-user', JSON.stringify({ _id: 'user-1' }));
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('creates a socket when authenticated', async () => {
    render(
      <AuthContext.Provider value={{ authUser: { _id: 'user-1' } }}>
        <SocketContextProvider>
          <Status />
        </SocketContextProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => expect(screen.getByText('connected')).toBeInTheDocument());
  });
});
