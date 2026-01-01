import { Dumbbell } from 'lucide-react';

export default function Login() {
  const handleLogin = () => {
    // Redirect to the backend Google Login endpoint
    window.location.href = '/api/auth/google/login';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-12 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
              <Dumbbell className="text-black" size={32} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter">Fitness Buddy</h1>
          <p className="text-neutral-500 font-medium text-lg">
            Track your progress, reach your goals.
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-white text-black py-4 px-8 rounded-2xl font-bold text-lg hover:bg-neutral-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em]">
          Secure login powered by Google
        </p>
      </div>
    </div>
  );
}
