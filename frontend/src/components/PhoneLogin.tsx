import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { setupRecaptcha, sendOTP, verifyOTP, signInWithPhone } from '../lib/firebase';
import type { RecaptchaVerifier } from 'firebase/auth';

type Step = 'phone' | 'otp' | 'verifying';

export default function PhoneLogin() {
    const [step, setStep] = useState<Step>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Initialize reCAPTCHA on mount
        if (!recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current = setupRecaptcha('send-otp-button');
        }
    }, []);

    const handleSendOTP = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            await sendOTP(formattedPhone, recaptchaVerifierRef.current!);
            setStep('otp');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter the complete OTP');
            return;
        }

        setLoading(true);
        setStep('verifying');
        setError('');

        try {
            const { idToken, phoneNumber: phone } = await verifyOTP(otpString);
            await signInWithPhone(idToken, phone);
        } catch (err) {
            setStep('otp');
            setError(err instanceof Error ? err.message : 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'verifying') {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-neutral-400 text-sm">Signing you in...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {step === 'phone' && (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                            Phone Number
                        </label>
                        <div className="flex gap-2">
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                <span className="text-neutral-400 text-sm font-medium">+91</span>
                            </div>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter your mobile number"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                maxLength={10}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <button
                        id="send-otp-button"
                        onClick={handleSendOTP}
                        disabled={loading || phoneNumber.length < 10}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>Send OTP</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </>
            )}

            {step === 'otp' && (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                            Enter OTP sent to +91{phoneNumber}
                        </label>
                        <div className="flex gap-2 justify-center">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { otpInputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    maxLength={1}
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    )}

                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading || otp.join('').length !== 6}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                <span>Verify & Login</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => {
                            setStep('phone');
                            setOtp(['', '', '', '', '', '']);
                            setError('');
                        }}
                        className="w-full text-neutral-500 text-sm hover:text-white transition-colors"
                    >
                        Change phone number
                    </button>
                </>
            )}
        </div>
    );
}
