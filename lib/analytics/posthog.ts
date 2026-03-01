import posthog from 'posthog-js';

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

export const initPostHog = () => {
    if (typeof window !== 'undefined' && POSTHOG_KEY) {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            person_profiles: 'identified_only', // or 'always' depending on requirements
            capture_pageview: false, // We handle this manually to ensure SPA accuracy
            capture_pageleave: true,
            autocapture: true, // Captures clicks, inputs, etc automatically
        });
    }
};

// Identify the user when they log in
export const identifyUser = (id: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && POSTHOG_KEY) {
        posthog.identify(id, properties);
    }
};

// Reset Posthog on log out
export const resetUser = () => {
    if (typeof window !== 'undefined' && POSTHOG_KEY) {
        posthog.reset();
    }
};

// Log specific events
export const capture = (event: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && POSTHOG_KEY) {
        posthog.capture(event, properties);
    }
};
