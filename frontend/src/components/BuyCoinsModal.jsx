import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { createPaymentIntent, confirmPayment } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function BuyCoinsModal({ isOpen, onClose, onSuccess }) {
  const { withAccessToken } = useAuth();
  
  const [step, setStep] = useState('SELECT'); // SELECT, QR_CODE, PROCESSING, SUCCESS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [intent, setIntent] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const packages = [
    { id: 'small', amount: 5, coins: 500, label: '$5' },
    { id: 'medium', amount: 10, coins: 1000, label: '$10', popular: true },
    { id: 'large', amount: 50, coins: 5000, label: '$50' },
    { id: 'xlarge', amount: 100, coins: 10000, label: '$100' },
  ];

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT');
      setSelectedPackage(null);
      setIntent(null);
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  // Countdown timer for QR Code
  useEffect(() => {
    let timer;
    if (step === 'QR_CODE' && intent) {
      timer = setInterval(() => {
        const remaining = Math.max(0, intent.expiresAt - Date.now());
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          setError('Payment session expired. Please try again.');
          setStep('SELECT');
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, intent]);

  if (!isOpen) return null;

  const handleGenerateQR = async () => {
    if (!selectedPackage) return;
    
    setLoading(true);
    setError('');

    try {
      const paymentIntent = await withAccessToken((token) => 
        createPaymentIntent(selectedPackage.amount, token)
      );
      
      setIntent(paymentIntent);
      setTimeLeft(Math.max(0, paymentIntent.expiresAt - Date.now()));
      setStep('QR_CODE');
    } catch (err) {
      console.error('Failed to create payment intent', err);
      setError('Failed to generate payment request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!intent) return;

    setStep('PROCESSING');
    setError('');

    try {
      // Add a realistic simulated delay for "blockchain/bank verification"
      await new Promise(resolve => setTimeout(resolve, 2000));

      await withAccessToken((token) => confirmPayment(intent.paymentId, token));
      
      setStep('SUCCESS');
      
      // Auto close after showing success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);

    } catch (err) {
      console.error('Payment confirmation failed', err);
      setError(err?.data?.error || 'Payment verification failed.');
      setStep('QR_CODE');
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderSelectStep = () => (
    <>
      <p className="text-gray-400 mb-6 text-sm">
        Top up your balance to continue trading on Future. Select a package below.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => setSelectedPackage(pkg)}
            disabled={loading}
            className={`
              relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200
              ${selectedPackage?.id === pkg.id 
                ? 'border-neon-green bg-neon-green/10 shadow-[0_0_15px_rgba(0,255,170,0.2)]' 
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
              }
            `}
          >
            {pkg.popular && (
              <div className="absolute -top-3 bg-neon-green text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(0,255,170,0.5)]">
                Popular
              </div>
            )}
            <span className="text-2xl font-bold text-white mb-1">{pkg.coins}</span>
            <span className="text-xs text-gray-400 uppercase tracking-widest mb-3">Coins</span>
            
            <div className={`
              w-full py-1.5 rounded text-sm font-semibold text-center transition-colors
              ${selectedPackage?.id === pkg.id ? 'bg-neon-green text-black' : 'bg-gray-700 text-white'}
            `}>
              {pkg.label}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerateQR}
        disabled={!selectedPackage || loading}
        className={`
          w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300
          ${!selectedPackage || loading 
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
            : 'bg-neon-green text-black hover:shadow-[0_0_20px_rgba(0,255,170,0.4)] hover:bg-[#00cc88]'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-black/20 border-t-black rounded-full"></span>
            Generating...
          </span>
        ) : selectedPackage ? (
          `Buy ${selectedPackage.coins} Coins`
        ) : (
          'Select a Package'
        )}
      </button>
    </>
  );

  const renderQRCodeStep = () => (
    <div className="flex flex-col items-center py-4 animate-in fade-in zoom-in duration-300">
      <h3 className="text-xl font-bold text-white mb-2">Scan to Pay</h3>
      <p className="text-gray-400 text-sm mb-6 text-center">
        Use your mobile wallet app to scan this QR code and complete your payment of <span className="text-white font-bold">${intent?.amount}</span>.
      </p>

      <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(0,255,170,0.15)] mb-6">
        {intent?.qrPayload && (
          <QRCode 
            value={intent.qrPayload}
            size={180}
            level="H"
            fgColor="#000000"
            bgColor="#ffffff"
          />
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
        <span className="text-neon-green animate-pulse">●</span> 
        Code expires in: <span className="font-mono text-white">{formatTime(timeLeft)}</span>
      </div>

      <button
        onClick={handleSimulatePayment}
        className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold text-sm uppercase tracking-wider transition-colors border border-gray-600 flex items-center justify-center gap-2"
      >
        <span>📱</span> Simulate Scanner App
      </button>
      
      <button
        onClick={() => setStep('SELECT')}
        className="mt-4 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Cancel and go back
      </button>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-300">
      <div className="w-16 h-16 border-4 border-gray-800 border-t-neon-green rounded-full animate-spin mb-6"></div>
      <h3 className="text-lg font-bold text-white mb-2">Processing Payment</h3>
      <p className="text-gray-400 text-sm text-center">
        Verifying transaction with the provider.<br/>Please do not close this window.
      </p>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in duration-500">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
        <div className="text-5xl text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">✓</div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
      <p className="text-green-400 text-lg font-medium mb-1">
        +{intent?.coins} Coins
      </p>
      <p className="text-gray-400 text-sm text-center">
        Your balance has been updated.
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative max-h-[90vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-800/40 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-neon-green">⚡</span> Buy Coins
          </h2>
          {step !== 'PROCESSING' && step !== 'SUCCESS' && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 relative overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {step === 'SELECT' && renderSelectStep()}
          {step === 'QR_CODE' && renderQRCodeStep()}
          {step === 'PROCESSING' && renderProcessingStep()}
          {step === 'SUCCESS' && renderSuccessStep()}
        </div>
      </div>
    </div>
  );
}

export default BuyCoinsModal;
