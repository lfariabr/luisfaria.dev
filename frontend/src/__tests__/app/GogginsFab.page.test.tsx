import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GogginsFab } from '@/components/goggins/GogginsFab';
import { MockedProvider } from '@apollo/client/testing';

describe('GogginsFab', () => {
  it('renders and opens dialog on click', async () => {
    render(
      <MockedProvider>
        <GogginsFab />
      </MockedProvider>
    );

    // Button should be present
    const btn = await screen.findByRole('button', { name: /activate goggins mode/i });
    await userEvent.click(btn);

    // Dialog title should be visible
    expect(await screen.findByText(/goggins mode/i)).toBeInTheDocument();
  });
});
