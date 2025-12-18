import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { OnboardingStep } from '../../../electron/common/ipc-types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('onboardingStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    useOnboardingStore.setState({
      completed: false,
      currentStep: OnboardingStep.WELCOME,
      selectedProviders: [],
      selectedTools: [],
      startedAt: undefined,
      completedAt: undefined,
    })
  })

  describe('OnboardingStep enum', () => {
    it('has all 7 steps', () => {
      expect(OnboardingStep.WELCOME).toBe(0)
      expect(OnboardingStep.ACQUISITION).toBe(1)
      expect(OnboardingStep.PROVIDERS).toBe(2)
      expect(OnboardingStep.CONNECT).toBe(3)
      expect(OnboardingStep.TOOLS).toBe(4)
      expect(OnboardingStep.TEST).toBe(5)
      expect(OnboardingStep.DONE).toBe(6)
    })
  })

  describe('initial state', () => {
    it('initializes with completed: false for new users', () => {
      const state = useOnboardingStore.getState()
      expect(state.completed).toBe(false)
    })

    it('starts at WELCOME step', () => {
      const state = useOnboardingStore.getState()
      expect(state.currentStep).toBe(OnboardingStep.WELCOME)
    })

    it('has empty selectedProviders', () => {
      const state = useOnboardingStore.getState()
      expect(state.selectedProviders).toEqual([])
    })

    it('has empty selectedTools', () => {
      const state = useOnboardingStore.getState()
      expect(state.selectedTools).toEqual([])
    })
  })

  describe('setStep', () => {
    it('sets the current step', () => {
      useOnboardingStore.getState().setStep(OnboardingStep.PROVIDERS)
      expect(useOnboardingStore.getState().currentStep).toBe(OnboardingStep.PROVIDERS)
    })

    it('sets startedAt when moving past WELCOME', () => {
      useOnboardingStore.getState().setStep(OnboardingStep.PROVIDERS)
      expect(useOnboardingStore.getState().startedAt).toBeDefined()
    })
  })

  describe('nextStep', () => {
    it('advances to next step', () => {
      useOnboardingStore.getState().nextStep()
      expect(useOnboardingStore.getState().currentStep).toBe(OnboardingStep.ACQUISITION)
    })

    it('does not exceed DONE step', () => {
      useOnboardingStore.getState().setStep(OnboardingStep.DONE)
      useOnboardingStore.getState().nextStep()
      expect(useOnboardingStore.getState().currentStep).toBe(OnboardingStep.DONE)
    })
  })

  describe('prevStep', () => {
    it('goes to previous step', () => {
      useOnboardingStore.getState().setStep(OnboardingStep.ACQUISITION)
      useOnboardingStore.getState().prevStep()
      expect(useOnboardingStore.getState().currentStep).toBe(OnboardingStep.WELCOME)
    })

    it('does not go below WELCOME step', () => {
      useOnboardingStore.getState().prevStep()
      expect(useOnboardingStore.getState().currentStep).toBe(OnboardingStep.WELCOME)
    })
  })

  describe('setProviders', () => {
    it('sets selected providers', () => {
      useOnboardingStore.getState().setProviders(['claude', 'gemini'])
      expect(useOnboardingStore.getState().selectedProviders).toEqual(['claude', 'gemini'])
    })
  })

  describe('setTools', () => {
    it('sets selected tools', () => {
      useOnboardingStore.getState().setTools(['cline', 'cursor'])
      expect(useOnboardingStore.getState().selectedTools).toEqual(['cline', 'cursor'])
    })
  })

  describe('complete', () => {
    it('marks onboarding as complete', () => {
      useOnboardingStore.getState().complete()
      expect(useOnboardingStore.getState().completed).toBe(true)
    })

    it('sets completedAt timestamp', () => {
      useOnboardingStore.getState().complete()
      expect(useOnboardingStore.getState().completedAt).toBeDefined()
    })

    it('sets step to DONE', () => {
      useOnboardingStore.getState().complete()
      expect(useOnboardingStore.getState().currentStep).toBe(OnboardingStep.DONE)
    })
  })

  describe('reset', () => {
    it('resets to initial state', () => {
      useOnboardingStore.getState().setProviders(['claude'])
      useOnboardingStore.getState().setTools(['cline'])
      useOnboardingStore.getState().complete()
      
      useOnboardingStore.getState().reset()
      
      const state = useOnboardingStore.getState()
      expect(state.completed).toBe(false)
      expect(state.currentStep).toBe(OnboardingStep.WELCOME)
      expect(state.selectedProviders).toEqual([])
      expect(state.selectedTools).toEqual([])
    })
  })
})
