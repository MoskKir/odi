import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  Play,
  Layers,
  Bot,
  BarChart3,
  Target,
  Gamepad2,
  Eye,
  ClipboardList,
  Users,
  Rocket,
  Trophy,
  Building2,
  Lightbulb,
  Handshake,
  Sparkles,
  Zap,
  Shield,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Layers,
    title: '6 режимов обзора',
    text: 'Доска, Театр, Граф, Штаб, Аквариум, Терминал. Переключайтесь между представлениями одним кликом.',
  },
  {
    icon: Bot,
    title: 'AI-боты с характером',
    text: 'Модератор, Критик, Визионер, Провокатор и другие. Каждый со своей стратегией и личностью.',
  },
  {
    icon: BarChart3,
    title: 'Эмоциональный мониторинг',
    text: 'Отслеживание вовлечённости, напряжения и энергии команды в реальном времени.',
  },
  {
    icon: Target,
    title: 'Готовые сценарии',
    text: 'Бизнес-стратегия, Креативный штурм, Командообразование. Или создайте свой.',
  },
  {
    icon: Gamepad2,
    title: 'Геймификация',
    text: 'XP, уровни, достижения. Превращаем серьёзные обсуждения в увлекательную игру.',
  },
  {
    icon: Eye,
    title: 'Аквариум AI',
    text: 'Уникальная возможность наблюдать за мыслительным процессом AI-ботов в реальном времени.',
  },
]

const STEPS = [
  { icon: ClipboardList, title: 'Выберите сценарий', text: 'Бизнес-стратегия, мозговой штурм или свой сценарий' },
  { icon: Users, title: 'Соберите экипаж', text: 'Подберите AI-ботов под задачу или используйте автоподбор' },
  { icon: Rocket, title: 'Запустите миссию', text: 'Ваша команда и AI работают вместе в реальном времени' },
  { icon: Trophy, title: 'Получите результат', text: 'Карта идей, план действий и аналитика сессии' },
]

const SCENARIOS = [
  { icon: Building2, name: 'Бизнес-стратегия', desc: 'Стратегические решения совета директоров', badge: 'Популярный' },
  { icon: Lightbulb, name: 'Креативный штурм', desc: 'Генерация и проработка инновационных идей', badge: 'Новый' },
  { icon: Handshake, name: 'Командообразование', desc: 'Работа с конфликтами и укрепление команды', badge: null },
]

const STATS = [
  { value: '1 200+', label: 'Пользователей', icon: Users },
  { value: '8', label: 'AI-ботов', icon: Bot },
  { value: '15', label: 'Сценариев', icon: Target },
  { value: '4.8', label: 'Средний рейтинг', icon: Sparkles },
]

export function LandingPage() {
  const theme = useAppSelector((s) => s.app.theme)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const navigate = useNavigate()

  return (
    <div className={`${theme === 'dark' ? 'bp5-dark' : ''} landing-bw min-h-screen bg-[var(--lbw-bg)]`}>
      {/* Navbar */}
      <nav className="bg-[var(--lbw-bg)]/80 backdrop-blur-md border-b border-[var(--lbw-border)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--lbw-fg)]/10 flex items-center justify-center">
              <Gamepad2 className="w-4.5 h-4.5 text-[var(--lbw-fg)]" />
            </div>
            <span className="font-bold text-[var(--lbw-fg)] text-lg tracking-tight">ODI</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button size="sm" className="bg-[var(--lbw-fg)] text-[var(--lbw-bg)] hover:bg-[var(--lbw-fg)]/85" onClick={() => navigate('/dashboard')}>
                Мои игры <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-[var(--lbw-muted)] hover:text-[var(--lbw-fg)] hover:bg-[var(--lbw-fg)]/5" onClick={() => navigate('/login')}>
                  Войти
                </Button>
                <Button size="sm" className="bg-[var(--lbw-fg)] text-[var(--lbw-bg)] hover:bg-[var(--lbw-fg)]/85" onClick={() => navigate('/register')}>
                  Начать бесплатно
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-6 border-[var(--lbw-border)] bg-[var(--lbw-fg)]/5 text-[var(--lbw-muted)]">
              <Zap className="w-3 h-3 mr-1" />
              Организационно-деятельностные игры нового поколения
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-[var(--lbw-fg)] tracking-tight leading-[1.1] mb-6">
              Принимайте решения{' '}
              <span className="text-[var(--lbw-muted)]">
                вместе с AI
              </span>
            </h1>
            <p className="text-lg text-[var(--lbw-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
              Платформа для проведения стратегических сессий, где AI-боты с уникальными
              характерами помогают вашей команде находить неожиданные решения.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" className="bg-[var(--lbw-fg)] text-[var(--lbw-bg)] hover:bg-[var(--lbw-fg)]/85" onClick={() => navigate('/register')}>
                Начать бесплатно <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" className="border-[var(--lbw-border)] text-[var(--lbw-fg)] hover:bg-[var(--lbw-fg)]/5">
                <Play className="w-4 h-4" /> Как это работает?
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-[var(--lbw-border)] bg-[var(--lbw-fg)]/[0.02]">
          <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-[var(--lbw-fg)]/[0.06] flex items-center justify-center mb-1">
                  <stat.icon className="w-5 h-5 text-[var(--lbw-muted)]" />
                </div>
                <div className="text-3xl font-bold text-[var(--lbw-fg)] tracking-tight">{stat.value}</div>
                <div className="text-sm text-[var(--lbw-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 bg-[var(--lbw-fg)]/[0.06] text-[var(--lbw-muted)] border-transparent">Возможности</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--lbw-fg)] tracking-tight mb-3">
              Всё для эффективных сессий
            </h2>
            <p className="text-[var(--lbw-muted)] max-w-xl mx-auto">
              Инструменты, которые превращают обсуждения в результаты
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className="group border-[var(--lbw-border)] bg-[var(--lbw-surface)] hover:border-[var(--lbw-fg)]/25 transition-all duration-200 hover:shadow-md hover:shadow-black/5"
              >
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-[var(--lbw-fg)]/[0.06] flex items-center justify-center mb-2 group-hover:bg-[var(--lbw-fg)]/10 transition-colors">
                    <feature.icon className="w-5 h-5 text-[var(--lbw-fg)]/70" />
                  </div>
                  <CardTitle className="text-base text-[var(--lbw-fg)]">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[var(--lbw-muted)]">{feature.text}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-[var(--lbw-fg)]/[0.02] border-y border-[var(--lbw-border)]">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4 bg-[var(--lbw-fg)]/[0.06] text-[var(--lbw-muted)] border-transparent">Процесс</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--lbw-fg)] tracking-tight">
                Как это работает
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {STEPS.map((item, i) => (
                <div key={i} className="relative text-center group">
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[1px] bg-[var(--lbw-border)]" />
                  )}
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--lbw-fg)]/[0.06] flex items-center justify-center mx-auto mb-4 group-hover:bg-[var(--lbw-fg)]/10 transition-colors">
                      <item.icon className="w-7 h-7 text-[var(--lbw-fg)]/60" />
                    </div>
                    <div className="text-xs font-medium text-[var(--lbw-muted)] mb-2">Шаг {i + 1}</div>
                    <h3 className="font-semibold text-[var(--lbw-fg)] mb-1.5">{item.title}</h3>
                    <p className="text-sm text-[var(--lbw-muted)] leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Scenarios */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 bg-[var(--lbw-fg)]/[0.06] text-[var(--lbw-muted)] border-transparent">Шаблоны</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--lbw-fg)] tracking-tight mb-3">
              Готовые сценарии
            </h2>
            <p className="text-[var(--lbw-muted)]">Начните за минуту или создайте свой</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SCENARIOS.map((s) => (
              <Card
                key={s.name}
                className="group cursor-pointer border-[var(--lbw-border)] bg-[var(--lbw-surface)] hover:border-[var(--lbw-fg)]/25 transition-all duration-200 hover:shadow-md hover:shadow-black/5"
              >
                <CardHeader className="items-center text-center pb-2">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--lbw-fg)]/[0.06] flex items-center justify-center mb-2 group-hover:bg-[var(--lbw-fg)]/10 transition-colors">
                    <s.icon className="w-7 h-7 text-[var(--lbw-fg)]/60" />
                  </div>
                  {s.badge && <Badge className="text-[10px] bg-[var(--lbw-fg)]/[0.06] text-[var(--lbw-muted)] border-[var(--lbw-border)]">{s.badge}</Badge>}
                  <CardTitle className="text-lg text-[var(--lbw-fg)]">{s.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-[var(--lbw-muted)]">{s.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--lbw-border)]">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <Card className="relative overflow-hidden border-[var(--lbw-fg)]/10 bg-[var(--lbw-fg)]/[0.03]">
              <CardContent className="relative p-12 md:p-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--lbw-fg)]/[0.08] flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-7 h-7 text-[var(--lbw-fg)]/60" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--lbw-fg)] tracking-tight mb-4">
                  Готовы начать?
                </h2>
                <p className="text-lg text-[var(--lbw-muted)] mb-8 max-w-lg mx-auto">
                  Присоединяйтесь к командам, которые уже используют ODI
                  для принятия стратегических решений.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button size="lg" className="bg-[var(--lbw-fg)] text-[var(--lbw-bg)] hover:bg-[var(--lbw-fg)]/85" onClick={() => navigate('/register')}>
                    Создать аккаунт <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="lg" className="border-[var(--lbw-border)] text-[var(--lbw-fg)] hover:bg-[var(--lbw-fg)]/5" onClick={() => navigate('/login')}>
                    Войти
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <Separator className="bg-[var(--lbw-border)]" />
        <footer className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[var(--lbw-fg)]/10 flex items-center justify-center">
              <Gamepad2 className="w-3.5 h-3.5 text-[var(--lbw-fg)]/60" />
            </div>
            <span className="text-sm text-[var(--lbw-muted)]">ODI Platform</span>
          </div>
          <span className="text-xs text-[var(--lbw-muted)]">2026. Организационно-деятельностные игры.</span>
        </footer>
      </div>
    </div>
  )
}
