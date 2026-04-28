/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../client/src/pages/login/Login.jsx';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../client/src/context/AuthContext.jsx';

const mockLogin = jest.fn();

jest.mock('../../client/src/hooks/useLogin.js', () => ({
  __esModule: true,
  default: () => ({ loading: false, login: mockLogin }),
}));

describe('Login page', () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  it('submits username and password', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ authUser: null, setAuthUser: jest.fn() }}>
          <Login />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/enter username/i), 'alice');
    await user.type(screen.getByPlaceholderText(/enter password/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(mockLogin).toHaveBeenCalledWith('alice', 'Password123');
  });
});
