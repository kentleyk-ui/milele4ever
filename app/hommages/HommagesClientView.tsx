'use client'

import React, { useState, useEffect } from 'react'
import { Heart, Edit2, Save, X, Plus, Trash2, Copy } from 'lucide-react'

type TimelineEntry = { id: string; year: number; title: string; summary: string; side: 'left' | 'right' }
type SouvenirEntry = { id: string; title: string; detail: string; type: string; icon: string }
type FamilyMember = { id: string; role: string; name: string; note: string }
type TributeEntry = { id: string; author: string; text: string; date: string }
type HeritageEntry = { id: string; title: string; description: string; href: string }

const STORAGE_KEY = 'milele-hommages-editor'

export default function HommagesClientView() {
  const [activeTab, setActiveTab] = useState('Chronologie')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const [memorialName, setMemorialName] = useState('Malaika')
  const [memorialYears, setMemorialYears] = useState('2010 - 2026')
  const [memorialQuote, setMemorialQuote] = useState('Toujours dans nos cœurs')
  const [photoUrl, setPhotoUrl] = useState('/og-image.avif')
  const [candleCount, setCandleCount] = useState(0)
  
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([])
  const [souvenirs, setSouvenirs] = useState<SouvenirEntry[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [tributes, setTributes] = useState<TributeEntry[]>([])
  const [heritageEntries, setHeritageEntries] = useState<HeritageEntry[]>([])

  // Charger depuis localStorage après montage
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setMemorialName(data.memorialName || 'Malaika')
        setMemorialYears(data.memorialYears || '2010 - 2026')
        setMemorialQuote(data.memorialQuote || 'Toujours dans nos cœurs')
        setPhotoUrl(data.photoUrl || '/og-image.avif')
        setCandleCount(data.candleCount || 0)
        setTimelineEntries(data.timelineEntries || [])
        setSouvenirs(data.souvenirs || [])
        setFamilyMembers(data.familyMembers || [])
        setTributes(data.tributes || [])
        setHeritageEntries(data.heritageEntries || [])
      } catch (e) {
        console.error('Error loading hommages data:', e)
      }
    }
  }, [])

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (!mounted) return
    const data = { memorialName, memorialYears, memorialQuote, photoUrl, candleCount, timelineEntries, souvenirs, familyMembers, tributes, heritageEntries }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setSaveStatus('✓ Sauvegardé')
    const timer = setTimeout(() => setSaveStatus(''), 2000)
    return () => clearTimeout(timer)
  }, [memorialName, memorialYears, memorialQuote, photoUrl, candleCount, timelineEntries, souvenirs, familyMembers, tributes, heritageEntries, mounted])

  const handleLightCandle = () => setCandleCount(c => c + 1)

  if (!mounted) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white">Chargement...</div></div>
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_15%,#0f766e_0%,rgba(15,118,110,0.18)_18%,transparent_36%),radial-gradient(circle_at_90%_12%,rgba(251,191,36,0.2)_0%,transparent_35%),linear-gradient(160deg,#030712_0%,#020617_55%,#00171a_100%)]">
      <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-emerald-400/25 blur-3xl" style={{ animation: 'driftBlob 14s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute -right-20 top-36 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" style={{ animation: 'driftBlob 18s ease-in-out infinite reverse' }} />
      <div className="pointer-events-none absolute bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" style={{ animation: 'driftBlob 16s ease-in-out infinite' }} />
      {/* Hero Section */}
      <section className="relative h-96 md:h-screen flex items-center justify-center text-center px-4">
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.3),transparent_55%)]"></div>
        <div className="relative z-10 w-full max-w-4xl rounded-[2rem] border border-emerald-400/35 bg-white/[0.045] p-6 shadow-[0_32px_100px_rgba(2,6,23,0.62),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(56,189,248,0.18)] backdrop-blur-2xl md:p-10">
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(120deg,rgba(255,255,255,0.18)_0%,transparent_22%,transparent_78%,rgba(255,255,255,0.12)_100%)] opacity-70" />
          <div className="mx-auto mb-8 flex h-48 w-48 items-center justify-center rounded-[1.7rem] border-2 border-cyan-200/70 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-cyan-950/80 p-2 shadow-[0_22px_55px_rgba(0,0,0,0.55),0_0_0_6px_rgba(125,211,252,0.16),inset_0_2px_0_rgba(255,255,255,0.3)]">
            <div className="relative flex h-52 w-52 items-center justify-center overflow-hidden rounded-[1.75rem] border-[7px] border-amber-300/95 bg-emerald-950/85 text-6xl font-bold text-amber-50 shadow-[inset_0_0_0_6px_rgba(3,7,18,0.95),inset_0_2px_12px_rgba(251,191,36,0.15),0_0_0_4px_rgba(148,163,184,0.7),0_22px_50px_rgba(0,0,0,0.55)]">
              <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-[linear-gradient(150deg,rgba(255,255,255,0.28)_0%,transparent_40%,transparent_65%,rgba(255,255,255,0.16)_100%)]" />
              <div className="pointer-events-none absolute -inset-4 rounded-full border-[2px] border-amber-300/50" style={{ animation: 'haloOuter 2.8s ease-in-out infinite' }} />
              <div className="pointer-events-none absolute -inset-8 rounded-full border border-emerald-400/35" style={{ animation: 'haloInner 3.5s ease-in-out infinite' }} />
              <img src={photoUrl} alt={memorialName} className="h-full w-full object-cover" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-3 bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent">{memorialName}</h1>
          <p className="text-purple-300 text-lg md:text-2xl mb-4">{memorialYears}</p>
          <p className="text-gray-200 text-lg md:text-xl italic mb-8 font-light">&quot;{memorialQuote}&quot;</p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={handleLightCandle} className="flex items-center gap-2 rounded-xl border-2 border-amber-200/70 bg-gradient-to-br from-amber-600/20 to-amber-700/10 px-7 py-3.5 text-white shadow-[0_16px_40px_rgba(251,191,36,0.28),inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(251,191,36,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:from-amber-600/30 hover:to-amber-700/15 active:translate-y-0 font-semibold">
              <Heart className="w-5 h-5" />
              Allumer une bougie ({candleCount})
            </button>
            <button onClick={() => setIsEditorOpen(!isEditorOpen)} className="flex items-center gap-2 rounded-xl border-2 border-cyan-200/70 bg-gradient-to-br from-cyan-600/20 to-cyan-700/10 px-7 py-3.5 text-white shadow-[0_16px_40px_rgba(56,189,248,0.28),inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(56,189,248,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:from-cyan-600/30 hover:to-cyan-700/15 active:translate-y-0 font-semibold">
              <Edit2 className="w-5 h-5" />
              {isEditorOpen ? 'Terminer' : 'Éditer'}
            </button>
          </div>
        </div>
      </section>

      {/* Editor Panel */}
      {isEditorOpen && (
        <section className="border-t-2 border-emerald-400/35 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-3xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">Éditer le contenu</h2>
              <span className="text-green-400">{saveStatus}</span>
            </div>

            {/* Editor Tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {['Chronologie', 'Souvenirs', 'Famille', 'Hommages', 'Heritage'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === tab ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_8px_16px_rgba(16,185,129,0.3)]' : 'bg-white/[0.06] text-gray-200 hover:bg-white/[0.12] border border-white/10'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="rounded-2xl border-2 border-slate-600/60 bg-gradient-to-br from-slate-900/80 to-slate-950/70 p-6 shadow-[0_20px_55px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl mb-4">
              {activeTab === 'Chronologie' && (
                <div>
                  <h3 className="text-xl font-bold text-emerald-100 mb-4">Chronologie</h3>
                  {timelineEntries.map(entry => (
                    <div key={entry.id} className="mb-3 p-3 bg-gradient-to-r from-slate-700/50 to-slate-800/40 rounded-lg border border-slate-600/50 backdrop-blur-sm">
                      <input type="number" value={entry.year} onChange={e => setTimelineEntries(timelineEntries.map(x => x.id === entry.id ? {...x, year: parseInt(e.target.value)} : x))} className="w-full bg-slate-700/70 text-white p-2 rounded border border-slate-600/50 mb-2 focus:ring-2 focus:ring-emerald-400 focus:bg-slate-700" />
                      <input type="text" value={entry.title} onChange={e => setTimelineEntries(timelineEntries.map(x => x.id === entry.id ? {...x, title: e.target.value} : x))} className="w-full bg-slate-700/70 text-white p-2 rounded border border-slate-600/50 mb-2 focus:ring-2 focus:ring-emerald-400 focus:bg-slate-700" />
                      <button onClick={() => setTimelineEntries(timelineEntries.filter(x => x.id !== entry.id))} className="text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setTimelineEntries([...timelineEntries, { id: Date.now().toString(), year: new Date().getFullYear(), title: '', summary: '', side: 'left' }])} className="mt-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg flex items-center gap-2 hover:shadow-[0_6px_16px_rgba(16,185,129,0.3)]"><Plus className="w-5 h-5" /> Ajouter</button>
                </div>
              )}
              {activeTab === 'Souvenirs' && (
                <div>
                  <h3 className="text-xl font-bold text-emerald-100 mb-4">Souvenirs</h3>
                  {souvenirs.map(item => (
                    <div key={item.id} className="mb-3 p-3 bg-gradient-to-r from-slate-700/50 to-slate-800/40 rounded-lg border border-slate-600/50 backdrop-blur-sm">
                      <input type="text" value={item.title} onChange={e => setSouvenirs(souvenirs.map(x => x.id === item.id ? {...x, title: e.target.value} : x))} className="w-full bg-slate-700/70 text-white p-2 rounded border border-slate-600/50 mb-2 focus:ring-2 focus:ring-emerald-400 focus:bg-slate-700" placeholder="Titre" />
                      <button onClick={() => setSouvenirs(souvenirs.filter(x => x.id !== item.id))} className="text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setSouvenirs([...souvenirs, { id: Date.now().toString(), title: '', detail: '', type: 'photo', icon: '📷' }])} className="mt-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg flex items-center gap-2 hover:shadow-[0_6px_16px_rgba(16,185,129,0.3)]"><Plus className="w-5 h-5" /> Ajouter</button>
                </div>
              )}
              {activeTab === 'Famille' && (
                <div>
                  <h3 className="text-xl font-bold text-emerald-100 mb-4">Famille</h3>
                  {familyMembers.map(member => (
                    <div key={member.id} className="mb-3 p-3 bg-gradient-to-r from-slate-700/50 to-slate-800/40 rounded-lg border border-slate-600/50 backdrop-blur-sm">
                      <input type="text" value={member.name} onChange={e => setFamilyMembers(familyMembers.map(x => x.id === member.id ? {...x, name: e.target.value} : x))} className="w-full bg-slate-700/70 text-white p-2 rounded border border-slate-600/50 mb-2 focus:ring-2 focus:ring-emerald-400 focus:bg-slate-700" placeholder="Nom" />
                      <button onClick={() => setFamilyMembers(familyMembers.filter(x => x.id !== member.id))} className="text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setFamilyMembers([...familyMembers, { id: Date.now().toString(), role: '', name: '', note: '' }])} className="mt-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg flex items-center gap-2 hover:shadow-[0_6px_16px_rgba(16,185,129,0.3)]"><Plus className="w-5 h-5" /> Ajouter</button>
                </div>
              )}
              {activeTab === 'Hommages' && (
                <div>
                  <h3 className="text-xl font-bold text-emerald-100 mb-4">Hommages</h3>
                  {tributes.map(tribute => (
                    <div key={tribute.id} className="mb-3 p-3 bg-gradient-to-r from-slate-700/50 to-slate-800/40 rounded-lg border border-slate-600/50 backdrop-blur-sm">
                      <input type="text" value={tribute.author} onChange={e => setTributes(tributes.map(x => x.id === tribute.id ? {...x, author: e.target.value} : x))} className="w-full bg-slate-700/70 text-white p-2 rounded border border-slate-600/50 mb-2 focus:ring-2 focus:ring-emerald-400 focus:bg-slate-700" placeholder="Auteur" />
                      <button onClick={() => setTributes(tributes.filter(x => x.id !== tribute.id))} className="text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setTributes([...tributes, { id: Date.now().toString(), author: '', text: '', date: new Date().toLocaleDateString() }])} className="mt-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg flex items-center gap-2 hover:shadow-[0_6px_16px_rgba(16,185,129,0.3)]"><Plus className="w-5 h-5" /> Ajouter</button>
                </div>
              )}
              {activeTab === 'Heritage' && (
                <div>
                  <h3 className="text-xl font-bold text-emerald-100 mb-4">Héritage</h3>
                  {heritageEntries.map(entry => (
                    <div key={entry.id} className="mb-3 p-3 bg-gradient-to-r from-slate-700/50 to-slate-800/40 rounded-lg border border-slate-600/50 backdrop-blur-sm">
                      <input type="text" value={entry.title} onChange={e => setHeritageEntries(heritageEntries.map(x => x.id === entry.id ? {...x, title: e.target.value} : x))} className="w-full bg-slate-700/70 text-white p-2 rounded border border-slate-600/50 mb-2 focus:ring-2 focus:ring-emerald-400 focus:bg-slate-700" placeholder="Titre" />
                      <button onClick={() => setHeritageEntries(heritageEntries.filter(x => x.id !== entry.id))} className="text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setHeritageEntries([...heritageEntries, { id: Date.now().toString(), title: '', description: '', href: '#' }])} className="mt-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg flex items-center gap-2 hover:shadow-[0_6px_16px_rgba(16,185,129,0.3)]"><Plus className="w-5 h-5" /> Ajouter</button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Content Sections */}
      <section className="relative z-10 py-16 px-4 max-w-5xl mx-auto">
        <div className="space-y-12">
          {/* Chronologie */}
          {timelineEntries.length > 0 && (
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent mb-10 text-center">Chronologie</h2>
              <div className="relative">
                {timelineEntries.map((entry, idx) => (
                  <div key={entry.id} className={`flex ${entry.side === 'left' ? 'flex-row' : 'flex-row-reverse'} mb-8`}>
                    <div className="w-1/2"></div>
                    <div className="w-1/2 px-4">
                      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-5 rounded-xl border-2 border-emerald-400/40 shadow-[0_12px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm hover:border-emerald-400/60 transition">
                        <p className="text-purple-300 font-bold">{entry.year}</p>
                        <p className="text-white font-bold">{entry.title}</p>
                        <p className="text-gray-300">{entry.summary}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Souvenirs */}
          {souvenirs.length > 0 && (
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent mb-10 text-center">Souvenirs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {souvenirs.map(item => (
                  <div key={item.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-5 rounded-xl border-2 border-emerald-400/40 shadow-[0_12px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm hover:border-emerald-400/60 transition">
                    <span className="text-3xl">{item.icon}</span>
                    <p className="text-white font-bold">{item.title}</p>
                    <p className="text-gray-300">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Famille */}
          {familyMembers.length > 0 && (
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent mb-10 text-center">Famille</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {familyMembers.map(member => (
                  <div key={member.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-5 rounded-xl border-2 border-emerald-400/40 shadow-[0_12px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm hover:border-emerald-400/60 transition">
                    <p className="text-purple-300 font-bold">{member.role}</p>
                    <p className="text-white">{member.name}</p>
                    {member.note && <p className="text-gray-300 text-sm">{member.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hommages */}
          {tributes.length > 0 && (
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent mb-10 text-center">Hommages</h2>
              <div className="space-y-4">
                {tributes.map(tribute => (
                  <div key={tribute.id} className="bg-gradient-to-r from-slate-800/80 via-slate-850/70 to-slate-900/60 p-5 rounded-xl border-l-4 border-emerald-400 shadow-[0_12px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm">
                    <p className="text-purple-300 italic">&quot;{tribute.text}&quot;</p>
                    <p className="text-gray-300 text-sm mt-2">— {tribute.author}</p>
                    <p className="text-gray-500 text-xs">{tribute.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Heritage */}
          {heritageEntries.length > 0 && (
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent mb-10 text-center">Héritage</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {heritageEntries.map(entry => (
                  <a key={entry.id} href={entry.href} className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-5 rounded-xl border-2 border-emerald-400/40 shadow-[0_12px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm hover:border-emerald-400/60 transition">
                    <p className="text-white font-bold">{entry.title}</p>
                    <p className="text-gray-300">{entry.description}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes driftBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.05); }
          50% { transform: translate(-10px, 20px) scale(0.95); }
          75% { transform: translate(-25px, -15px) scale(1.02); }
        }
        @keyframes candleGlowPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.65; }
        }
        @keyframes haloOuter {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
        @keyframes haloInner {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(0.85); opacity: 0.15; }
        }
      `}</style>
    </div>
  )
}
