import React, { useState } from 'react';
import { 
  X, 
  Users, 
  CreditCard, 
  Settings, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Clock, 
  ShieldCheck, 
  Calendar, 
  Eye, 
  Trash2, 
  Ban, 
  UserCheck, 
  RefreshCw,
  Upload,
  QrCode,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { User, DBSBankSettings, PaymentSubmission, SubscriptionPlanId, UserAccountStatus } from '../types';
import { 
  getUsers, 
  updateUserPlan, 
  updateUserStatus, 
  deleteUser, 
  getPaymentSubmissions, 
  approvePayment, 
  rejectPayment, 
  updateDBSBankSettings 
} from '../utils/authStorage';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankSettings: DBSBankSettings;
  onSettingsUpdated: (newSettings: DBSBankSettings) => void;
  onDataChanged: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  bankSettings,
  onSettingsUpdated,
  onDataChanged
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'settings'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<User[]>(getUsers());
  const [payments, setPayments] = useState<PaymentSubmission[]>(getPaymentSubmissions());

  // Receipt preview modal state
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [rejectionNoteModal, setRejectionNoteModal] = useState<string | null>(null); // submission ID
  const [rejectNoteText, setRejectNoteText] = useState('');

  // Settings form state
  const [holderName, setHolderName] = useState(bankSettings.accountHolderName);
  const [bankName, setBankName] = useState(bankSettings.bankName);
  const [accountNumber, setAccountNumber] = useState(bankSettings.accountNumber);
  const [payNowNumber, setPayNowNumber] = useState(bankSettings.payNowNumber);
  const [qrCodeUrl, setQrCodeUrl] = useState(bankSettings.qrCodeUrl);
  const [price3Mo, setPrice3Mo] = useState(bankSettings.prices['3_months']);
  const [price6Mo, setPrice6Mo] = useState(bankSettings.prices['6_months']);
  const [price1Yr, setPrice1Yr] = useState(bankSettings.prices['1_year']);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  if (!isOpen) return null;

  const refreshLocalState = () => {
    setUsers(getUsers());
    setPayments(getPaymentSubmissions());
    onDataChanged();
  };

  const handleAssignPlan = (userId: string, plan: SubscriptionPlanId) => {
    updateUserPlan(userId, plan);
    refreshLocalState();
  };

  const handleToggleBlock = (userId: string, currentStatus: UserAccountStatus) => {
    const nextStatus: UserAccountStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    updateUserStatus(userId, nextStatus);
    refreshLocalState();
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      deleteUser(userId);
      refreshLocalState();
    }
  };

  const handleApprove = (submissionId: string) => {
    approvePayment(submissionId);
    refreshLocalState();
  };

  const handleRejectConfirm = () => {
    if (rejectionNoteModal) {
      rejectPayment(rejectionNoteModal, rejectNoteText.trim() || 'Payment not verified.');
      setRejectionNoteModal(null);
      setRejectNoteText('');
      refreshLocalState();
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setQrCodeUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DBSBankSettings = {
      accountHolderName: holderName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      payNowNumber: payNowNumber.trim(),
      qrCodeUrl,
      prices: {
        '3_months': Number(price3Mo) || 39,
        '6_months': Number(price6Mo) || 69,
        '1_year': Number(price1Yr) || 119
      },
      instructions: bankSettings.instructions
    };
    updateDBSBankSettings(updated);
    onSettingsUpdated(updated);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2500);
  };

  // Filter users by search term
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.plan.toLowerCase().includes(userSearch.toLowerCase())
  );

  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Admin Management Dashboard
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                  Admin@kmh Authorized
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                User directory, DBS payment approvals, and bank account settings
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white border-t-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>User Directory &amp; Plans ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center gap-2 transition-all relative ${
              activeTab === 'payments'
                ? 'bg-slate-900 text-white border-t-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>DBS Payment Approvals</span>
            {pendingPaymentsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                {pendingPaymentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center gap-2 transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>DBS Bank &amp; Pricing Setup</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm text-slate-300">
          {/* TAB 1: User Directory & Plan Control */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email, or plan..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="text-xs text-slate-400">
                  Showing <strong>{filteredUsers.length}</strong> registered accounts
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-3">Plan</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Expires At</th>
                        <th className="py-3 px-4 text-right">One-Click Plan Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredUsers.map((u) => {
                        const isExpired = new Date(u.subscriptionExpiresAt).getTime() < Date.now() && u.plan !== 'lifetime';
                        const daysLeft = Math.max(0, Math.ceil((new Date(u.subscriptionExpiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

                        return (
                          <tr key={u.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {u.role === 'admin' && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        ADMIN
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                                u.plan === 'lifetime'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : u.plan === '1_year'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : u.plan === '6_months'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : u.plan === '3_months'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : isExpired
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {u.plan === 'trial' ? `Trial (${daysLeft}d left)` : u.plan.replace('_', ' ')}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                u.status === 'active'
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : u.status === 'pending_payment'
                                  ? 'text-amber-400 bg-amber-500/10'
                                  : 'text-rose-400 bg-rose-500/10'
                              }`}>
                                {u.status === 'pending_payment' ? 'Payment Pending' : u.status}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-slate-400 text-[11px] font-mono">
                              {u.plan === 'lifetime' ? (
                                <span className="text-purple-300 font-semibold">Never Expires</span>
                              ) : (
                                <div>
                                  <span className={isExpired ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                                    {new Date(u.subscriptionExpiresAt).toLocaleDateString()}
                                  </span>
                                  <span className="block text-[10px] text-slate-500">
                                    {isExpired ? 'Expired' : `${daysLeft} days left`}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              {u.role === 'admin' ? (
                                <span className="text-[11px] text-slate-500 italic">Full Authority</span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* Quick Plan Buttons */}
                                  <button
                                    onClick={() => handleAssignPlan(u.id, 'trial')}
                                    title="Set 7-Day Trial"
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition"
                                  >
                                    +7d Trial
                                  </button>
                                  <button
                                    onClick={() => handleAssignPlan(u.id, '3_months')}
                                    title="Assign 3 Months Plan"
                                    className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[10px] font-semibold transition"
                                  >
                                    3 Mo
                                  </button>
                                  <button
                                    onClick={() => handleAssignPlan(u.id, '6_months')}
                                    title="Assign 6 Months Plan"
                                    className="px-2 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-[10px] font-semibold transition"
                                  >
                                    6 Mo
                                  </button>
                                  <button
                                    onClick={() => handleAssignPlan(u.id, '1_year')}
                                    title="Assign 1 Year Plan"
                                    className="px-2 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white text-[10px] font-semibold transition"
                                  >
                                    1 Yr
                                  </button>
                                  <button
                                    onClick={() => handleAssignPlan(u.id, 'expired')}
                                    title="Revoke / Expire Access Immediately"
                                    className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[10px] font-semibold transition"
                                  >
                                    Revoke
                                  </button>

                                  {/* Toggle Block */}
                                  <button
                                    onClick={() => handleToggleBlock(u.id, u.status)}
                                    title={u.status === 'blocked' ? 'Unblock User' : 'Block User'}
                                    className="p-1 rounded text-slate-400 hover:text-amber-400 transition ml-1"
                                  >
                                    {u.status === 'blocked' ? <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Ban className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    title="Delete User"
                                    className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Pending DBS Payment Approvals */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">DBS &amp; PayNow Payment Queue</h4>
                  <p className="text-xs text-slate-400">Review transfer receipts and activate user subscriptions.</p>
                </div>
                <button
                  onClick={refreshLocalState}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Queue</span>
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
                  No payment submissions found.
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((sub) => (
                    <div 
                      key={sub.id} 
                      className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
                        sub.status === 'pending'
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : sub.status === 'approved'
                          ? 'bg-slate-950/40 border-slate-800'
                          : 'bg-rose-950/20 border-rose-500/30'
                      }`}
                    >
                      {/* Left: User & Plan Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{sub.userEmail}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            sub.status === 'pending'
                              ? 'bg-amber-500 text-slate-950'
                              : sub.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 flex items-center gap-2">
                          <span>Plan: <strong className="text-white">{sub.planName}</strong></span>
                          <span>·</span>
                          <span>Amount: <strong className="text-emerald-400 font-mono">SGD ${sub.amountSGD}.00</strong></span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Ref: <strong className="text-indigo-300 font-mono">{sub.transactionRef}</strong></span>
                          <span>·</span>
                          <span>Submitted: {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {sub.adminNote && (
                          <p className="text-[11px] text-rose-400 italic">Admin Note: {sub.adminNote}</p>
                        )}
                      </div>

                      {/* Right: Receipt Thumbnail & Actions */}
                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        {sub.receiptImageUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewReceipt(sub.receiptImageUrl)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                            <span>View Receipt</span>
                          </button>
                        )}

                        {sub.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(sub.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve &amp; Activate</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectionNoteModal(sub.id);
                                setRejectNoteText('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold transition border border-rose-500/40"
                            >
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : sub.status === 'approved' ? (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Activated
                          </span>
                        ) : (
                          <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Declined
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DBS Bank & Plan Pricing Settings */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
              {settingsSavedToast && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>DBS Bank details and subscription pricing updated successfully!</span>
                </div>
              )}

              {/* Bank Transfer Details */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-red-400" />
                  <span>DBS Bank Singapore Account Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">DBS Account Number</label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">PayNow UEN / Mobile</label>
                    <input
                      type="text"
                      required
                      value={payNowNumber}
                      onChange={(e) => setPayNowNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* QR Code Upload */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-slate-300 font-medium text-xs mb-2">
                    PayNow / DBS QR Code Image
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-white p-1 border border-slate-700 shrink-0 overflow-hidden flex items-center justify-center">
                      <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New QR Code</span>
                        <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                      </label>
                      <p className="text-[11px] text-slate-500 mt-1">Upload an image of your official DBS PayNow QR Code.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Pricing Settings */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Subscription Plan Pricing (SGD $)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">3 Months Plan (SGD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500 font-mono">$</span>
                      <input
                        type="number"
                        min={1}
                        value={price3Mo}
                        onChange={(e) => setPrice3Mo(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">6 Months Plan (SGD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500 font-mono">$</span>
                      <input
                        type="number"
                        min={1}
                        value={price6Mo}
                        onChange={(e) => setPrice6Mo(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">1 Year Plan (SGD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500 font-mono">$</span>
                      <input
                        type="number"
                        min={1}
                        value={price1Yr}
                        onChange={(e) => setPrice1Yr(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow"
              >
                <Check className="w-4 h-4" />
                <span>Save DBS &amp; Pricing Changes</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Fullscreen Receipt Image Viewer */}
      {previewReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-2xl p-4 border border-slate-700">
            <button
              onClick={() => setPreviewReceipt(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xs font-bold text-white mb-3">Submitted Payment Proof</h4>
            <div className="rounded-xl overflow-hidden bg-black max-h-[70vh] flex items-center justify-center">
              <img src={previewReceipt} alt="Receipt proof" className="max-w-full max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Note Modal */}
      {rejectionNoteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Decline Payment Submission</span>
            </h4>
            <p className="text-xs text-slate-400">
              Provide a reason to inform the user why this receipt was rejected:
            </p>
            <textarea
              value={rejectNoteText}
              onChange={(e) => setRejectNoteText(e.target.value)}
              placeholder="e.g. Transaction Reference could not be verified in DBS portal. Please resubmit."
              rows={3}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectionNoteModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
