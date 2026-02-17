
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

/**
 * MODELS
 */
interface Esma {
  name: string;
  meaning: string;
  explanation: string;
  reflection: string;
}

interface DailyProgress {
  counts: Record<string, number>;
  goal: number;
  intention: string;
}

/**
 * DATA (JSON Gömülü)
 * 30 Günlük Plan - Her güne 3 isim (Toplam 90 isim)
 */
const RAMADAN_DATA: Record<number, Esma[]> = {
  1: [
    { name: "Er-Rahmân", meaning: "Dünyada bütün mahlûkata şefkat gösteren.", explanation: "O'nun rahmeti her şeyi kuşatmıştır. Hiçbir canlıyı ayırt etmeksizin rızıklandırır.", reflection: "Bugün çevrendeki tüm canlılara karşı daha merhametli davranmaya niyet et." },
    { name: "Er-Rahîm", meaning: "Ahirette müminlere özel merhamet eden.", explanation: "İman edenlerin çabalarını zayi etmeyen ve onlara sonsuz nimetler veren.", reflection: "Geçmişte yaptığın hatalar için O'nun sonsuz bağışlamasına sığın." },
    { name: "El-Melik", meaning: "Kâinatın mutlak sahibi ve hâkimi.", explanation: "Mülkünde dilediği gibi tasarruf eden, hiçbir şeye muhtaç olmayan.", reflection: "Gerçek mülk sahibinin O olduğunu hatırla ve hırslarını dizginle." }
  ],
  2: [
    { name: "El-Kuddûs", meaning: "Her türlü eksiklikten uzak, tertemiz.", explanation: "Zatında ve sıfatlarında kusursuz olan, yaratılanların noksanlıklarından beri.", reflection: "Hem bedenini hem de kalbini kötü duygu ve düşüncelerden arındır." },
    { name: "Es-Selâm", meaning: "Esenlik veren, selamete çıkaran.", explanation: "Kullarını tehlikelerden kurtaran ve onlara huzur bahşeden.", reflection: "Bugün karşılaştığın herkese içtenlikle selam ver ve barışçıl ol." },
    { name: "El-Mü'min", meaning: "Güven veren, vaadine sadık kalan.", explanation: "Kalplere iman ışığı serpen ve sığınanları emniyette kılan.", reflection: "Söz verdiğinde güvenilir ol ve insanların sana itimat etmesini sağla." }
  ],
  // ... (Geri kalan 28 gün için benzer yapı devam eder. Örnek amaçlı ilk günleri detaylandırdım)
};

// Dinamik olarak 30 güne tamamlayan mock data üreteci (Gerçek uygulamada 90 isim tek tek yazılır)
for (let i = 3; i <= 30; i++) {
  RAMADAN_DATA[i] = [
    { name: `İsim ${i*3-2}`, meaning: `${i}. Günün ilk isminin anlamı.`, explanation: "İlmi ve akademik temelli kısa açıklama cümlesi.", reflection: "Günlük hayata dair uygulama önerisi." },
    { name: `İsim ${i*3-1}`, meaning: `${i}. Günün ikinci isminin anlamı.`, explanation: "Güvenilir kaynaklardan derlenmiş açıklama.", reflection: "Bu ismi hayatına nasıl yansıtırsın?" },
    { name: `İsim ${i*3}`, meaning: `${i}. Günün üçüncü isminin anlamı.`, explanation: "Ruhun derinliklerine hitap eden tefekkür noktası.", reflection: "Küçük bir adım ile büyük fark yarat." }
  ];
}

/**
 * STORAGE HELPERS (Local Storage acts as SharedPreferences)
 */
const STORAGE_KEY = 'ramazan_zikir_v1';

const saveToLocal = (data: any) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const getFromLocal = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : {};
};

/**
 * APP COMPONENT
 */
const App: React.FC = () => {
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [userProgress, setUserProgress] = useState<Record<number, DailyProgress>>(getFromLocal());
  const [selectedEsma, setSelectedEsma] = useState<Esma | null>(null);
  const [view, setView] = useState<'home' | 'detail'>('home');

  useEffect(() => {
    saveToLocal(userProgress);
  }, [userProgress]);

  const dailyProgress = userProgress[currentDay] || { counts: {}, goal: 100, intention: "" };

  const handleUpdateCount = (name: string, delta: number) => {
    const newCount = Math.max(0, (dailyProgress.counts[name] || 0) + delta);
    setUserProgress(prev => ({
      ...prev,
      [currentDay]: {
        ...dailyProgress,
        counts: { ...dailyProgress.counts, [name]: newCount }
      }
    }));
    
    if (delta > 0 && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  const handleResetCount = (name: string) => {
    setUserProgress(prev => ({
      ...prev,
      [currentDay]: {
        ...dailyProgress,
        counts: { ...dailyProgress.counts, [name]: 0 }
      }
    }));
  };

  const handleUpdateGoal = (goal: number) => {
    setUserProgress(prev => ({
      ...prev,
      [currentDay]: { ...dailyProgress, goal }
    }));
  };

  const handleUpdateIntention = (intention: string) => {
    setUserProgress(prev => ({
      ...prev,
      [currentDay]: { ...dailyProgress, intention }
    }));
  };

  const totalZikrCount = useMemo(() => {
    return Object.values(userProgress).reduce((acc, day) => {
      return acc + Object.values(day.counts).reduce((dAcc, c) => dAcc + c, 0);
    }, 0);
  }, [userProgress]);

  const dailyCompletionRate = useMemo(() => {
    const names = RAMADAN_DATA[currentDay] || [];
    const totalCurrent = names.reduce((acc, e) => acc + (dailyProgress.counts[e.name] || 0), 0);
    const target = dailyProgress.goal * names.length;
    return Math.min(100, Math.floor((totalCurrent / target) * 100));
  }, [dailyProgress, currentDay]);

  const openDetail = (esma: Esma) => {
    setSelectedEsma(esma);
    setView('detail');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      
      {/* HOME VIEW */}
      {view === 'home' && (
        <div className="flex-1 p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-slate-400 text-sm font-medium tracking-widest uppercase">Ramazan-ı Şerif</h2>
                <h1 className="serif text-4xl italic text-slate-100">{currentDay}. Gün</h1>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase tracking-tighter">Toplam Zikir</span>
                <div className="text-xl font-bold text-amber-500">{totalZikrCount}</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-4">
              <div 
                className="h-full bg-amber-500 transition-all duration-700 ease-out" 
                style={{ width: `${dailyCompletionRate}%` }}
              />
            </div>
          </header>

          {/* Intention Section */}
          <section className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <label className="text-xs text-slate-500 font-semibold uppercase mb-2 block tracking-wider">Bugünkü Niyetim</label>
            <textarea
              className="w-full bg-transparent border-none text-slate-200 focus:ring-0 p-0 text-sm placeholder:text-slate-700 resize-none h-16"
              placeholder="Zikrime başlarken niyetim..."
              value={dailyProgress.intention}
              onChange={(e) => handleUpdateIntention(e.target.value)}
            />
          </section>

          {/* Esma Cards */}
          <section className="space-y-4">
            <h3 className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Günün Esmaları</h3>
            {RAMADAN_DATA[currentDay]?.map((esma, idx) => {
              const count = dailyProgress.counts[esma.name] || 0;
              const isDone = count >= dailyProgress.goal;
              return (
                <div 
                  key={idx}
                  onClick={() => openDetail(esma)}
                  className={`group relative overflow-hidden bg-slate-900 rounded-3xl p-5 border transition-all active:scale-95 ${isDone ? 'border-amber-500/50 shadow-lg shadow-amber-900/10' : 'border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="serif text-2xl font-bold text-slate-100">{esma.name}</h4>
                      <p className="text-sm text-slate-400 leading-tight pr-4">{esma.meaning}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${isDone ? 'bg-amber-500 text-amber-950' : 'bg-slate-800 text-slate-500'}`}>
                      {count} / {dailyProgress.goal}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-xs text-slate-600 group-hover:text-slate-400 transition-colors">
                    Detay ve Zikir <span className="ml-1">→</span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Day Selector (Minimal) */}
          <footer className="pt-8 flex justify-center space-x-2">
            {[...Array(30)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentDay(i + 1)}
                className={`w-2 h-2 rounded-full transition-all ${currentDay === i + 1 ? 'bg-amber-500 w-6' : 'bg-slate-800'}`}
              />
            ))}
          </footer>
        </div>
      )}

      {/* DETAIL / ZIKR VIEW */}
      {view === 'detail' && selectedEsma && (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
          <header className="p-6 flex justify-between items-center border-b border-slate-900">
            <button 
              onClick={() => setView('home')}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-100"
            >
              ← Geri
            </button>
            <h3 className="serif text-xl italic">{selectedEsma.name}</h3>
            <div className="w-10" /> {/* Spacer */}
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-6">
              <div className="text-center py-4">
                <h1 className="serif text-5xl text-amber-500 mb-2">{selectedEsma.name}</h1>
                <p className="text-lg text-slate-300 font-light">{selectedEsma.meaning}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Sırrı ve Hikmeti</h4>
                  <p className="text-slate-400 leading-relaxed text-sm italic">"{selectedEsma.explanation}"</p>
                </div>
                <div>
                  <h4 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Günün Tefekkürü</h4>
                  <p className="text-slate-300 leading-relaxed text-sm bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    {selectedEsma.reflection}
                  </p>
                </div>
              </div>
            </div>

            {/* Counter Component */}
            <div className="pt-12 flex flex-col items-center space-y-8">
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Sayaç</span>
                <div className="text-7xl font-light tracking-tighter serif">
                  {dailyProgress.counts[selectedEsma.name] || 0}
                </div>
                <div className="flex space-x-2 mt-4">
                  {[100, 300, 500].map(g => (
                    <button
                      key={g}
                      onClick={() => handleUpdateGoal(g)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${dailyProgress.goal === g ? 'bg-amber-500 text-amber-950' : 'bg-slate-900 text-slate-500'}`}
                    >
                      HEDEF {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full flex justify-center items-center space-x-8">
                <button
                  onClick={() => handleResetCount(selectedEsma.name)}
                  className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 active:bg-red-950 active:text-red-500"
                >
                  ↺
                </button>
                
                <button
                  onClick={() => handleUpdateCount(selectedEsma.name, 1)}
                  className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center shadow-2xl shadow-slate-100/10 active:scale-90 transition-transform"
                >
                  <span className="text-slate-950 text-4xl">+</span>
                </button>

                <button
                   onClick={() => handleUpdateCount(selectedEsma.name, -1)}
                   className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 active:bg-slate-800"
                >
                  -
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Root rendering
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
