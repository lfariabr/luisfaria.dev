const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () =>
  jest.fn().mockImplementation(() => ({ messages: { create: mockCreate } })),
);

import { chatWithAI } from '../../services/claude';

const reply = (overrides: Record<string, unknown> = {}) => ({
  stop_reason: 'end_turn',
  content: [
    { type: 'thinking', thinking: '' },
    { type: 'text', text: 'Hello ' },
    { type: 'text', text: 'there' },
  ],
  ...overrides,
});

describe('claude service', () => {
  beforeEach(() => mockCreate.mockReset());

  it('sends one user turn to the configured model at low effort', async () => {
    mockCreate.mockResolvedValue(reply());

    await chatWithAI('What does Luis build?');

    const params = mockCreate.mock.calls[0][0];
    expect(params).toMatchObject({
      model: 'claude-haiku-5-5',
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: 'What does Luis build?' }],
    });
    expect(params.system).toContain('Luis Faria');
    // Current models reject a non-default temperature
    expect(params).not.toHaveProperty('temperature');
  });

  it('returns only the text blocks, joined', async () => {
    mockCreate.mockResolvedValue(reply());
    await expect(chatWithAI('hi')).resolves.toBe('Hello there');
  });

  it('answers politely when Claude declines', async () => {
    mockCreate.mockResolvedValue(reply({ stop_reason: 'refusal', content: [] }));
    await expect(chatWithAI('hi')).resolves.toMatch(/can’t help/);
  });

  it('wraps API errors in one generic error, keeping the cause', async () => {
    const apiError = new Error('credit balance too low');
    mockCreate.mockRejectedValue(apiError);
    await expect(chatWithAI('hi')).rejects.toMatchObject({
      message: 'Failed to get response from AI service',
      cause: apiError,
    });
  });
});
