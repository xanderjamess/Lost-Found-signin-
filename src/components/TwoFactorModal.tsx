import React from 'react';
import { ShieldCheck, X, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

interface TwoFactorModalProps {
  onClose: () => void;
  onVerify: () => void;
  email: string;
}

export default function TwoFactorModal({ onClose, onVerify, email }: TwoFactorModalProps) {
  const [code, setCode] = React.useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState('');
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      if (fullCode === '123456') {
        setIsSuccess(true);
        setTimeout(() => {
          onVerify();
        }, 1500);
      } else {
        setError('The code you entered is incorrect. Please try again.');
        setIsVerifying(false);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md overflow-hidden rounded-3xl shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center">
            <ShieldCheck className="text-primary mr-3" size={24} />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Identity Verification</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 text-center bg-white">
          {!isSuccess ? (
            <div>
              <div className="mb-8">
                <p className="text-sm text-slate-500 mb-1">Verification code sent to</p>
                <p className="font-bold text-slate-900 text-lg">{email}</p>
                <p className="text-xs text-slate-400 mt-2">Enter the 6-digit code to continue</p>
              </div>

              <div className="flex justify-center space-x-2 mb-10">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => inputRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={e => handleChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-12 h-16 text-center text-2xl font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                ))}
              </div>

              {error && (
                <div className="mb-8 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full btn-primary py-4 flex items-center justify-center"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="animate-spin mr-3" size={20} />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Identity
                    <ArrowRight className="ml-3" size={20} />
                  </>
                )}
              </button>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Didn't receive the code? <button className="text-primary font-bold hover:underline">Resend Code</button>
                </p>
                <div className="mt-4 p-2 bg-slate-50 rounded-lg text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Demo Hint: Use 123456
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="text-green-500" size={56} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Identity Verified</h3>
              <p className="text-sm text-slate-500">Your claim request has been submitted successfully.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
