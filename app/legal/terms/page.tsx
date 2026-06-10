'use client'

import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollText, CheckCircle, User, Ban, DollarSign, Server, AlertTriangle, UserX, FileText, Scale } from 'lucide-react'

export default function TermsOfServicePage() {
  const { t } = useI18n()

  const sections = [
    {
      icon: CheckCircle,
      title: t('legal.acceptance'),
      content: [
        'By accessing or using Milele, you agree to be bound by these Terms of Service.',
        'If you do not agree to these terms, you may not use the platform.',
        'These terms may be updated periodically. Continued use constitutes acceptance.',
      ],
    },
    {
      icon: ScrollText,
      title: t('legal.serviceDesc'),
      content: [
        'Milele provides a digital platform for creating memorials and managing end-of-life services.',
        'We do NOT provide legal, financial, or medical advice.',
        'All memorial content is user-generated and does not reflect Milele\'s views.',
      ],
    },
    {
      icon: User,
      title: t('legal.accountRegistration'),
      content: [
        'You must be at least 18 years old to create an account.',
        'You must provide accurate and complete information.',
        'You are responsible for all activity under your account.',
      ],
    },
    {
      icon: Ban,
      title: t('legal.acceptableUse'),
      content: [
        'No illegal, fraudulent, or harmful content.',
        'No spam, scraping, or automated abuse.',
        'No harassment, hate speech, or discriminatory content.',
        'No reverse engineering or unauthorized access attempts.',
      ],
    },
    {
      icon: Scale,
      title: t('legal.userDataOwnership'),
      content: [
        'You retain ownership of all content you upload.',
        'You grant Milele a limited license to host and display your content.',
        'You may delete your account and content at any time.',
      ],
    },
    {
      icon: DollarSign,
      title: t('legal.payments'),
      content: [
        'Some features may require payment.',
        'All payments are processed through secure third-party processors.',
        'Refund policy: within 14 days of purchase for unused services.',
      ],
    },
    {
      icon: Server,
      title: t('legal.serviceAvailability'),
      content: [
        'We strive for 99.9% uptime but do not guarantee uninterrupted service.',
        'Scheduled maintenance may cause temporary unavailability.',
        'We are not liable for downtime beyond our reasonable control.',
      ],
    },
    {
      icon: AlertTriangle,
      title: t('legal.liability'),
      content: [
        'Milele is provided "as is" without warranties of any kind.',
        'Liability is capped at the amount paid in the last 12 months.',
        'We are not liable for indirect, consequential, or punitive damages.',
      ],
    },
    {
      icon: UserX,
      title: t('legal.termination'),
      content: [
        'You may terminate your account at any time.',
        'We may suspend accounts for violations of these terms.',
        'Data deletion follows GDPR guidelines within 30 days of termination.',
      ],
    },
    {
      icon: FileText,
      title: t('legal.governingLawTerms'),
      content: [
        'These terms are governed by the laws of France.',
        'Disputes shall be resolved in the courts of Paris, France.',
      ],
    },
  ]

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <ScrollText className="w-10 h-10 text-primary mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">{t('legal.terms')}</h1>
        <p className="text-muted-foreground">{t('legal.lastUpdated')}: June 10, 2026</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        {t('legal.disclaimer')}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card key={index}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              </div>
              <ul className="space-y-1.5 pl-2">
                {section.content.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1.5">&#8226;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>{t('legal.contactLegal')}: <a href="mailto:legal@milele.com" className="text-primary hover:underline">legal@milele.com</a></p>
      </div>
    </div>
  )
}
