// Mock for openai module (not installed)
module.exports = {
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '{"score": 0.85, "reason": "mock"}' } }],
        }),
      },
    },
  })),
};
