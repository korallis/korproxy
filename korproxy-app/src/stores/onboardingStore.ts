import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { OnboardingStep, type OnboardingState, type Provider, type AcquisitionSource, type UTMParams } from '@/types/electron'

interface OnboardingActions {
  setStep: (step: OnboardingStep) => void
  nextStep: () => void
  prevStep: () => void
  setProviders: (providers: Provider[]) => void
  setTools: (tools: string[]) => void
  setAcquisitionSource: (source: AcquisitionSource) => void
  setAcquisitionUtm: (utm: UTMParams) => void
  complete: () => void
  reset: () => void
}

type OnboardingStore = OnboardingState & OnboardingActions

const initialState: OnboardingState = {
  completed: false,
  currentStep: OnboardingStep.WELCOME,
  selectedProviders: [],
  selectedTools: [],
  acquisitionSource: undefined,
  acquisitionUtm: undefined,
  startedAt: undefined,
  completedAt: undefined,
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => {
        const state = get()
        if (!state.startedAt && step > OnboardingStep.WELCOME) {
          set({ currentStep: step, startedAt: new Date().toISOString() })
        } else {
          set({ currentStep: step })
        }
      },

      nextStep: () => {
        const { currentStep, startedAt } = get()
        const nextStep = Math.min(currentStep + 1, OnboardingStep.DONE)
        if (!startedAt && nextStep > OnboardingStep.WELCOME) {
          set({ currentStep: nextStep, startedAt: new Date().toISOString() })
        } else {
          set({ currentStep: nextStep })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        set({ currentStep: Math.max(currentStep - 1, OnboardingStep.WELCOME) })
      },

      setProviders: (providers) => set({ selectedProviders: providers }),

      setTools: (tools) => set({ selectedTools: tools }),

      setAcquisitionSource: (source) => set({ acquisitionSource: source }),

      setAcquisitionUtm: (utm) => set({ acquisitionUtm: utm }),

      complete: () => set({
        completed: true,
        currentStep: OnboardingStep.DONE,
        completedAt: new Date().toISOString(),
      }),

      reset: () => set(initialState),
    }),
    {
      name: 'korproxy-onboarding-storage',
    }
  )
)
