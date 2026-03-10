'use client'

import { useState } from 'react'
import { MessageSquarePlus, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n/context'

export function FeedbackButton() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    const subject = encodeURIComponent(t('feedback.emailSubject'))
    const body = encodeURIComponent(
      `${t('feedback.emailFrom')}: ${name || t('feedback.anonymous')}\n\n${message}`
    )
    const mailto = `mailto:kentley@milele4ever.com?cc=kentley@hotmail.com&subject=${subject}&body=${body}`

    window.location.href = mailto
    setSent(true)
    setSending(false)

    setTimeout(() => {
      setSent(false)
      setOpen(false)
      setName('')
      setMessage('')
    }, 2500)
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Feedback panel */}
        {open && (
          <div className="w-80 rounded-2xl border bg-background shadow-xl p-5 space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{t('feedback.title')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t('feedback.subtitle')}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors -mt-0.5"
                aria-label={t('common.cancel')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sent ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{t('feedback.sent')}</p>
                <p className="text-xs text-muted-foreground">{t('feedback.sentDesc')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="feedback-name" className="text-xs">{t('feedback.name')}</Label>
                  <Input
                    id="feedback-name"
                    placeholder={t('feedback.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="feedback-message" className="text-xs">{t('feedback.message')}</Label>
                  <Textarea
                    id="feedback-message"
                    placeholder={t('feedback.messagePlaceholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="text-sm resize-none min-h-[90px]"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full" disabled={sending || !message.trim()}>
                  <Send className="h-3.5 w-3.5 mr-2" />
                  {t('feedback.send')}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  {t('feedback.disclaimer')}
                </p>
              </form>
            )}
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
          aria-label={t('feedback.title')}
        >
          {open ? <X className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
        </button>
      </div>
    </>
  )
}
