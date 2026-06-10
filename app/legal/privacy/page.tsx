'use client'

import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Mail, Database, Lock, Users, Cookie, Baby, FileText, ExternalLink } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const { t } = useI18n()

  const sections = [
    {
      icon: Shield,
      title: t('legal.whoWeAre'),
      content: [
        `${t('legal.legalEntity')}: ${t('legal.entityName')}`,
        `${t('legal.country')}: ${t('legal.france')}`,
        `${t('legal.contactEmail')}: ${t('legal.contactEmail')}`,
      ],
    },
    {
      icon: Database,
      title: t('legal.whatData'),
      content: [
        'Account information: name, email, phone number',
        'User-generated content: memorials, photos, tributes, messages',
        'Uploaded files: images, documents, audio',
        'Usage logs: access times, feature usage, IP address',
      ],
    },
    {
      icon: FileText,
      title: t('legal.howWeUse'),
      content: [
        'Provide and maintain the Milele memorial platform',
        'Personalize your experience and memorial pages',
        'Send notifications and updates about your memorials',
        'Comply with legal obligations and prevent fraud',
      ],
    },
    {
      icon: ExternalLink,
      title: t('legal.thirdParty'),
      content: [
        'Supabase (Database): Secure storage of user data and memorial content',
        'Vercel (Hosting): Server infrastructure and analytics',
        'Replit Auth: Authentication and user management',
      ],
    },
    {
      icon: Lock,
      title: t('legal.dataStorage'),
      content: [
        'All data is encrypted at rest using AES-256',
        'Transport encryption via TLS 1.3',
        'Access controls and role-based permissions',
        'Regular security audits and penetration testing',
      ],
    },
    {
      icon: Users,
      title: t('legal.userRights'),
      content: [
        'Access: Request a copy of all your personal data',
        'Correction: Update or correct your information',
        'Deletion: Request complete account and data deletion',
        'Export: Download your data in a portable format',
      ],
    },
    {
      icon: Cookie,
      title: t('legal.cookies'),
      content: [
        'Session cookies: Essential for login and app functionality',
        'Preference cookies: Remember language and theme settings',
        'Analytics cookies: Anonymous usage statistics (optional)',
      ],
    },
    {
      icon: Baby,
      title: t('legal.minors'),
      content: [
        'Minimum age: 18 years old',
        'We do not knowingly collect data from children under 13',
        'If a minor\'s data is discovered, it will be deleted promptly',
      ],
    },
    {
      icon: FileText,
      title: t('legal.changes'),
      content: [
        'We may update this policy periodically',
        'Users will be notified 30 days before material changes',
        'Continued use after changes constitutes acceptance',
      ],
    },
  ]

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Shield className="w-10 h-10 text-primary mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">{t('legal.privacy')}</h1>
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
