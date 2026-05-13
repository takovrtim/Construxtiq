'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: false,        // See what John types
        maskInputOptions: {
          password: true,            // Except passwords
        },
      },
      autocapture: true,             // Captures every click automatically
      persistence: 'localStorage',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.opt_out_capturing()
      },
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
