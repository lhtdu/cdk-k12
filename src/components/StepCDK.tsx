import { useState } from 'react'
import { Key, ArrowRight, Search, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import CDKKeyChecker from './CDKKeyChecker'
import { checkCDKKeyStatus } from '../admin/db'

interface StepCDKProps {
  lang: 'vi' | 'en'
  onNext: (key: string) => void
}

export default function StepCDK({ lang, onNext }: StepCDKProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'used' | 'disabled' | 'notfound'>('idle')
  const [showChecker, setShowChecker] = useState(false)
  const [shake, setShake] = useState(false)

  const labels = {
    vi: {
      title: 'Nhập mã CDK',
      subtitle: 'Bước 1 trong 3',
      desc: 'Nhập mã CDK của bạn để bắt đầu kích hoạt Plus.',
      placeholder: 'VD: ABCD-1234-EFGH',
      checkKey: 'Kiểm tra Key',
      next: 'Tiếp tục',
      checking: 'Đang kiểm tra...',
      statusUsed: 'Mã này đã được sử dụng.',
      statusDisabled: 'Mã này đã bị vô hiệu hóa.',
      statusNotFound: 'Mã CDK không tìm thấy trong hệ thống.',
      statusValid: 'Mã hợp lệ - sẵn sàng kích hoạt.',
      error: 'Mã CDK phải có ít nhất 4 ký tự.',
    },
    en: {
      title: 'Enter CDK Code',
      subtitle: 'Step 1 of 3',
      desc: 'Enter your CDK code to start Plus activation.',
      placeholder: 'e.g. ABCD-1234-EFGH',
      checkKey: 'Check Key',
      next: 'Continue',
      checking: 'Checking...',
      statusUsed: 'This key has already been used.',
      statusDisabled: 'This key has been disabled.',
      statusNotFound: 'CDK key not found in system.',
      statusValid: 'Valid key - ready to activate.',
      error: 'CDK code must be at least 4 characters.',
    },
  }
  const t = labels[lang]

  async function checkKey(key: string) {
    setStatus('checking')
    const record = await checkCDKKeyStatus(key)
    if (!record) {
      setStatus('notfound')
    } else if (record.status === 'used') {
      setStatus('used')
    } else if (record.status === 'disabled') {
      setStatus('disabled')
    } else {
      setStatus('valid')
    }
  }

  function handleSubmit() {
    const trimmed = value.trim()
    if (trimmed.length < 4) {
      setError(t.error)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setError('')

    if (status === 'used' || status === 'disabled' || status === 'notfound') {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    onNext(trimmed.toUpperCase())
  }

  return (
    <>
      <div className={`animate-fade-in-up ${shake ? 'animate-shake' : ''}`}>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 shadow-xl">
          {/* Title */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <Key size={20} className="text-indigo-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">{t.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t.subtitle}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">{t.desc}</p>

          {/* CDK Input */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={value}
                onChange={e => {
                  const upper = e.target.value.toUpperCase()
                  setValue(upper)
                  if (error) setError('')
                  if (upper.length >= 4) {
                    checkKey(upper)
                  } else {
                    setStatus('idle')
                  }
                }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder={t.placeholder}
                className={`w-full bg-[#22253a] border rounded-xl px-4 py-3.5 text-sm font-mono font-semibold text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all pr-10 ${
                  (status === 'used' || status === 'disabled' || status === 'notfound' || error)
                    ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20'
                    : status === 'valid'
                    ? 'border-emerald-500/60 focus:border-emerald-500/80 focus:ring-emerald-500/20'
                    : 'border-[#2a2d3a] focus:border-indigo-500/60 focus:ring-indigo-500/20'
                }`}
                autoFocus
              />
              {/* Status icon */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {status === 'checking' && (
                  <Loader2 size={16} className="text-slate-400 animate-spin" strokeWidth={1.5} />
                )}
                {(status === 'used' || status === 'disabled' || status === 'notfound' || error) && (
                  <AlertCircle size={16} className="text-red-400" strokeWidth={1.5} />
                )}
                {status === 'valid' && (
                  <CheckCircle size={16} className="text-emerald-400" strokeWidth={1.5} />
                )}
              </div>
            </div>

            {/* Status message */}
            {status === 'checking' && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                {t.checking}
              </p>
            )}
            {status === 'used' && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle size={12} strokeWidth={1.5} />
                {t.statusUsed}
              </p>
            )}
            {status === 'disabled' && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle size={12} strokeWidth={1.5} />
                {t.statusDisabled}
              </p>
            )}
            {status === 'notfound' && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle size={12} strokeWidth={1.5} />
                {t.statusNotFound}
              </p>
            )}
            {status === 'valid' && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={12} strokeWidth={1.5} />
                {t.statusValid}
              </p>
            )}
            {error && !status && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle size={12} strokeWidth={1.5} />
                {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setShowChecker(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-xl bg-[#22253a] border border-[#2a2d3a] text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-all"
            >
              <Search size={13} strokeWidth={1.5} />
              {t.checkKey}
            </button>
            <button
              onClick={handleSubmit}
              disabled={status !== 'valid'}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-[0.97] shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.next}
              <ArrowRight size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {showChecker && (
        <CDKKeyChecker lang={lang} onClose={() => setShowChecker(false)} />
      )}
    </>
  )
}
