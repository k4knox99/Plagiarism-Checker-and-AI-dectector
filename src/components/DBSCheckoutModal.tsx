import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  Upload, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  QrCode, 
  FileText, 
  ArrowRight,
  Clock,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { DBSBankSettings, User } from '../types';
import { createPaymentSubmission } from '../utils/authStorage';

interface DBSCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  planId: '3_months' | '6_months' | '1_year';
  settings: DBSBankSettings;
  onPaymentSubmitted: () => void;
}

export const DBSCheckoutModal: React.FC<DBSCheckoutModalProps> = ({
  isOpen,
  onClose,
  user,
  planId,
  settings,
  onPaymentSubmitted
}) => {
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const planTitles: Record<string, { name: string; duration: string }> = {
    '3_months': { name: '3 Months Plan', duration: '90 Days Full Access' },
    '6_months': { name: '6 Months Plan', duration: '180 Days Full Access (Best Value)' },
    '1_year': { name: '1 Year Plan', duration: '365 Days Unlimited Access' }
  };

  const currentPlanInfo = planTitles[planId] || { name: 'VeritasAI Plan', duration: 'Full Access' };
  const currentPrice = settings.prices[planId] || 39;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, or WEBP screenshot).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot size must be under 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setReceiptImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in or register to submit a payment proof.');
      return;
    }
    if (!transactionRef.trim()) {
      setError('Please enter your Transaction Reference Number.');
      return;
    }
    if (!receiptImage) {
      setError('Please upload a screenshot of your DBS transfer or PayNow receipt.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      createPaymentSubmission(user, planId, transactionRef, receiptImage);
      setIsSubmitting(false);
      setIsSuccess(true);
      onPaymentSubmitted();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-extrabold text-sm tracking-wider shadow">
              DBS
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                DBS Bank / PayNow Checkout
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                  Singapore
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Direct FAST Bank Transfer &amp; DBS PayLah! Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm text-slate-300">
          {isSuccess ? (
            /* Success confirmation view */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Payment Proof Submitted!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Your reference <strong className="text-indigo-300 font-mono">{transactionRef}</strong> for the {currentPlanInfo.name} has been routed to the VeritasAI Administrator.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 max-w-sm mx-auto text-left text-xs space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan:</span>
                  <span className="font-semibold text-white">{currentPlanInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-mono text-emerald-400 font-bold">SGD ${currentPrice}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Verification Pending
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                You can continue using the trial while the Admin verifies your transaction.
              </p>

              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
              >
                Back to Workspace
              </button>
            </div>
          ) : (
            <>
              {/* Plan & Price Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/40 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-300 font-medium block">Selected Upgrade:</span>
                  <span className="text-base font-bold text-white">{currentPlanInfo.name}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">{currentPlanInfo.duration}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Due</span>
                  <span className="text-2xl font-extrabold text-white font-mono">
                    SGD ${currentPrice}
                  </span>
                </div>
              </div>

              {/* DBS Bank & PayNow Transfer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Account Info */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                    <CreditCard className="w-4 h-4 text-red-400" />
                    <span>DBS Bank Transfer Details</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Bank Name</span>
                      <span className="font-semibold text-white">{settings.bankName}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Account Holder Name</span>
                      <span className="font-semibold text-slate-200">{settings.accountHolderName}</span>
                    </div>

                    <div className="pt-1">
                      <span className="text-[11px] text-slate-400 block">DBS Account Number</span>
                      <div className="flex items-center justify-between mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="font-mono text-white font-bold">{settings.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.accountNumber, 'acc')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition"
                        >
                          {copiedKey === 'acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'acc' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">PayNow UEN / Mobile</span>
                      <div className="flex items-center justify-between mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="font-mono text-white font-bold">{settings.payNowNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.payNowNumber, 'paynow')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition"
                        >
                          {copiedKey === 'paynow' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'paynow' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PayNow QR Preview */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col items-center justify-center text-center space-y-2.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-purple-400" />
                    <span>Scan with DBS PayLah!</span>
                  </span>
                  <div className="w-40 h-40 rounded-xl bg-white p-2 shadow-inner flex items-center justify-center overflow-hidden border border-slate-700">
                    <img 
                      src={settings.qrCodeUrl} 
                      alt="DBS PayNow QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports PayNow, DBS PayLah!, OCBC, UOB, GrabPay, and Google Pay
                  </p>
                </div>
              </div>

              {/* Payment Proof Submission Form */}
              <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-slate-700/60 pb-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Submit Payment Proof for Instant Approval</span>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    DBS / PayNow Transaction Reference No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. DBS-20261014-98421 or 20261014002934"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Upload Payment Receipt Screenshot *
                  </label>
                  {receiptImage ? (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img 
                          src={receiptImage} 
                          alt="Receipt preview" 
                          className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                        />
                        <div className="truncate">
                          <span className="text-xs font-semibold text-emerald-400 block flex items-center gap-1">
                            <Check className="w-3 h-3" /> Receipt Attached
                          </span>
                          <span className="text-[10px] text-slate-400">Ready to submit for verification</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReceiptImage(null)}
                        className="text-xs text-rose-400 hover:text-rose-300 p-1"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-slate-950/60 hover:bg-slate-950">
                      <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                      <span className="text-xs text-slate-300 font-medium">
                        Click to upload transfer receipt
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        PNG, JPG, or WEBP up to 5MB
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting Proof...' : `Confirm Transfer of SGD $${currentPrice}`}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
