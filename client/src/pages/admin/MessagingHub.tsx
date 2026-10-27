import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Send,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Copy,
  Sliders,
  Unlink,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MessagingHub: React.FC = () => {
  const [statusData, setStatusData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // QR Modal
  const [qrModal, setQrModal] = useState<boolean>(false);
  const [qrImage, setQrImage] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState<boolean>(false);

  // Settings
  const [autoSend, setAutoSend] = useState<boolean>(true);
  const [intervalSecs, setIntervalSecs] = useState<number>(18);
  const [channel, setChannel] = useState<string>('WHATSAPP');
  const [template, setTemplate] = useState<string>('');

  useEffect(() => {
    loadStatus();
    loadLogs();
    const interval = setInterval(loadStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const res = await api.get('/messaging/status');
      if (res.data.success) {
        setStatusData(res.data);
        setAutoSend(res.data.config.autoSendOnSubmit);
        setIntervalSecs(res.data.config.dispatchIntervalSeconds || 18);
        setChannel(res.data.config.defaultChannel || 'WHATSAPP');
        setTemplate(res.data.config.messageTemplate || '');
      }
    } catch {
      // ignore
    }
  };

  const loadLogs = async () => {
    try {
      const res = await api.get('/messaging/logs?limit=30');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await api.put('/messaging/config', {
        autoSendOnSubmit: autoSend,
        dispatchIntervalSeconds: Number(intervalSecs),
        defaultChannel: channel,
        messageTemplate: template,
      });
      if (res.data.success) {
        toast.success('Messaging configuration saved.');
        loadStatus();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed.');
    }
  };

  const handleGenerateQr = async () => {
    setLoadingQr(true);
    setQrModal(true);
    try {
      const res = await api.post('/messaging/whatsapp/generate-qr');
      if (res.data.success) {
        setQrImage(res.data.qrImage);
      }
    } catch (err: any) {
      toast.error('Failed to generate WhatsApp QR code.');
    } finally {
      setLoadingQr(false);
    }
  };

  const handleUnlinkWhatsApp = async () => {
    if (!window.confirm('Are you sure you want to unlink the current WhatsApp number?')) return;
    try {
      const res = await api.post('/messaging/whatsapp/unlink');
      if (res.data.success) {
        toast.success(res.data.message);
        loadStatus();
      }
    } catch (err: any) {
      toast.error('Failed to unlink device.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const queue = statusData?.queue;
  const config = statusData?.config;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Automated Messaging Hub</h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch absentee notices automatically via WhatsApp Bot or Office Android SIM Gateway.
          </p>
        </div>

        <button
          onClick={loadStatus}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Gateway Connection Advisory Alert */}
      {!config?.whatsappLinked && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm">
                WhatsApp Gateway Not Linked
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Scan the QR code below using the college office smartphone, or configure the Android SIM SMS Gateway so queued absentee alerts dispatch automatically.
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateQr}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Connect WhatsApp Now</span>
          </button>
        </div>
      )}

      {/* Live Dispatch Queue Status Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                queue?.isProcessing ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {queue?.isProcessing ? 'Automated Dispatcher: In Progress' : 'Automated Dispatcher: Idle'}
              </h2>
              <span className="text-xs text-slate-500">
                {queue?.isProcessing
                  ? `Pacing 1 message every ${config?.dispatchIntervalSeconds || 18}s to prevent bans.`
                  : 'Queue empty. Awaiting attendance confirmation from teachers.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl">
              Pending in Queue: {queue?.queueLength || 0}
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl">
              Sent Today: {statusData?.stats?.sentToday || 0}
            </span>
          </div>
        </div>

        {queue?.currentJob && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs font-semibold text-indigo-950">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
              <span>
                Currently Sending to: <strong>{queue.currentJob.studentName}</strong> (
                {queue.currentJob.recipientPhone})
              </span>
            </div>
            <span className="text-indigo-700 font-bold">Next message in ~{intervalSecs}s</span>
          </div>
        )}
      </div>

      {/* Dual Channel Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Channel 1: WhatsApp Web Bot */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-black text-sm">Channel 1</span>
                <h3 className="font-black text-slate-900 text-lg">WhatsApp Web Bot</h3>
              </div>
              {config?.whatsappLinked ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected ({config.whatsappPhone || 'Active'})
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                  Not Linked
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Connect your official college phone number via QR Code once. Our lightweight background engine delivers
              absent notices directly to parents on WhatsApp without paid APIs.
            </p>

            {/* Easy Number Switch Guideline */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5">
              <span className="font-bold text-slate-800 block text-[11px] uppercase">
                💡 How to change WhatsApp SIM / Phone:
              </span>
              <p>1. Tap "Unlink Device" below to clear old session.</p>
              <p>2. Tap "Link New WhatsApp" to view fresh QR code.</p>
              <p>3. Open WhatsApp on new phone $\rightarrow$ Linked Devices $\rightarrow$ Scan QR. Done!</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={handleGenerateQr}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{config?.whatsappLinked ? 'Re-scan / Switch Number' : 'Scan QR to Link'}</span>
            </button>

            {config?.whatsappLinked && (
              <button
                onClick={handleUnlinkWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center gap-1"
                title="Unlink Phone"
              >
                <Unlink className="w-4 h-4" />
                <span>Unlink</span>
              </button>
            )}
          </div>
        </div>

        {/* Channel 2: Local Android SIM SMS Gateway */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600 font-black text-sm">Channel 2</span>
                <h3 className="font-black text-slate-900 text-lg">Office Android SIM SMS</h3>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                Reaches Basic Keypad Phones
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Use a spare Android phone in the college office with an unlimited Jazz/Zong SMS package. It automatically
              dispatches cellular SMS to parents who don't have WhatsApp.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  Poll Endpoint (Paste in Android App)
                </span>
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-800 mt-1">
                  <span className="truncate">https://gdc-attendance-api.onrender.com/api/sms/poll</span>
                  <button
                    onClick={() => copyToClipboard('https://gdc-attendance-api.onrender.com/api/sms/poll')}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  Gateway API Secret Key
                </span>
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-800 mt-1">
                  <span>{config?.smsGatewayApiKey || 'gdc_sms_secret_2026'}</span>
                  <button
                    onClick={() => copyToClipboard(config?.smsGatewayApiKey || 'gdc_sms_secret_2026')}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-500">
              App to install on phone: <strong>"Android SMS Gateway"</strong> (Open source APK from GitHub / Play
              Store).
            </span>
          </div>
        </div>
      </div>

      {/* Pacer & Template Settings Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Anti-Ban Dispatch Pacer & Notification Template</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Default Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="WHATSAPP">WhatsApp Web Bot (Default)</option>
              <option value="SMS_GATEWAY">Local SIM SMS Gateway</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Dispatch Delay (Pacer Interval)
            </label>
            <input
              type="number"
              min={12}
              max={45}
              value={intervalSecs}
              onChange={(e) => setIntervalSecs(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
            <span className="text-[10px] text-slate-400">Recommended: 15–20s (Prevents carrier spam block)</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Auto-Send on Confirmation
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="autoSend"
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="autoSend" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Automatically queue absentees when roll call is confirmed
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Parent Message Template (Variables: {'{STUDENT_NAME}'}, {'{ROLL_NO}'}, {'{CLASS_NAME}'}, {'{DATE}'})
          </label>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={2}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs shadow-md transition"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {/* Historical Dispatch Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900">Recent Dispatch Activity Logs ({logs.length})</span>
          <span className="text-xs text-slate-400">Live delivery records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Parent Phone</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {logs.map((log) => {
                let cleanPhone = (log.recipientPhone || '').replace(/\D/g, '');
                if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.substring(1);
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(log.messageText || '')}`;

                return (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.studentName}</td>
                    <td className="py-3 px-4">{log.rollNo}</td>
                    <td className="py-3 px-4 text-slate-600">{log.classSectionName}</td>
                    <td className="py-3 px-4 text-indigo-700 font-semibold">{log.recipientPhone}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded">{log.channel}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          log.status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'SENDING'
                            ? 'bg-indigo-100 text-indigo-800'
                            : log.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in WhatsApp Web"
                          className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(log.messageText || '')}
                          title="Copy Message Text"
                          className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Scan WhatsApp QR Code</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Open WhatsApp on the college phone $\rightarrow$ Linked Devices $\rightarrow$ Link a Device.
            </p>

            {loadingQr ? (
              <div className="w-48 h-48 mx-auto flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : qrImage ? (
              <div className="w-56 h-56 mx-auto p-2 bg-white rounded-2xl border border-slate-200 shadow-md">
                <img src={qrImage} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="text-xs text-rose-600 font-bold">Failed to generate QR code.</div>
            )}

            <button
              onClick={() => setQrModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
