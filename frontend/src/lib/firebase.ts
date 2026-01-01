import { initializeApp } from 'firebase/app';
import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
} from 'firebase/auth';
import type { ConfirmationResult, Auth } from 'firebase/auth';

// Firebase configuration - replace with your Firebase project config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

// Store confirmation result for OTP verification
let confirmationResult: ConfirmationResult | null = null;

// Setup invisible reCAPTCHA
export function setupRecaptcha(buttonId: string): RecaptchaVerifier {
    const verifier = new RecaptchaVerifier(auth, buttonId, {
        size: 'invisible',
        callback: () => {
            // reCAPTCHA solved
        }
    });
    return verifier;
}

// Send OTP to phone number
export async function sendOTP(
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
): Promise<void> {
    try {
        confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
}

// Verify OTP and get Firebase token
export async function verifyOTP(otp: string): Promise<{ idToken: string; phoneNumber: string }> {
    if (!confirmationResult) {
        throw new Error('No confirmation result. Please request OTP first.');
    }

    try {
        const result = await confirmationResult.confirm(otp);
        const idToken = await result.user.getIdToken();
        const phoneNumber = result.user.phoneNumber || '';
        return { idToken, phoneNumber };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw error;
    }
}

// Sign in with backend after Firebase verification
export async function signInWithPhone(idToken: string, phoneNumber: string): Promise<void> {
    const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, phoneNumber }),
        credentials: 'include'
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to sign in');
    }

    // Redirect to dashboard on success
    window.location.href = '/';
}
