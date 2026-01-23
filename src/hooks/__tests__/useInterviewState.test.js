import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';

// Ensure the test uses Retell path
vi.stubEnv('VITE_USE_RETELL', 'true');

// Mock useApplicationRealtime to return a simple application
vi.mock('@/hooks/useApplicationRealtime', () => ({
  useApplicationRealtime: (applicationId) => ({
    application: {
      id: applicationId,
      interview_status: 'invited',
      jobs: { title: 'Dev', requirements: [] }
    },
    loading: false,
    error: null
  })
}));

const startMock = vi.fn();
const stopMock = vi.fn();

vi.mock('@/hooks/useRetellConnection', () => ({
  useRetellConnection: () => ({
    callState: 'idle',
    isAgentSpeaking: false,
    transcript: [],
    error: null,
    startInterview: startMock,
    stopInterview: stopMock,
    isSaving: false,
    audioLevel: 0
  })
}));

vi.mock('@/hooks/useOpenAIRealtimeInterview', () => ({
  useOpenAIRealtimeInterview: () => ({
    callState: 'idle',
    isAgentSpeaking: false,
    transcript: [],
    error: null,
    startInterview: vi.fn(() => { throw new Error('OpenAI hook should not be invoked when using Retell') }),
    stopInterview: vi.fn(),
    isSaving: false,
    audioLevel: 0
  })
}));

import { useInterviewState } from '../useInterviewState';

describe('useInterviewState (Retell path)', () => {
  beforeEach(() => {
    startMock.mockClear();
  });

  it('calls Retell startInterview when starting an interview', async () => {
    const { result } = renderHook(() => useInterviewState({ applicationId: 'test-app', user: { id: 'u1', user_metadata: { full_name: 'Test User' } } }));

    // call startInterview wrapper
    await act(async () => {
      await result.current.startInterview();
    });

    expect(startMock).toHaveBeenCalled();
  });
});
