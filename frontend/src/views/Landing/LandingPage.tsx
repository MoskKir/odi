import { Button, Card, Tag } from '@blueprintjs/core'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store'

const FEATURES = [
  {
    icon: '\u{1F3AD}',
    title: '6 режимов обзора',
    text: 'Доска, Театр, Граф, Штаб, Аквариум, Терминал. Переключайтесь между представлениями одним кликом.',
  },
  {
    icon: '\u{1F916}',
    title: 'AI-боты с характером',
    text: 'Модератор, Критик, Визионер, Провокатор и другие. Каждый со своей стратегией и личностью.',
  },
  {
    icon: '\u{1F4CA}',
    title: 'Эмоциональный мониторинг',
    text: 'Отслеживание вовлечённости, напряжения и энергии команды в реальном времени.',
  },
  {
    icon: '\u{1F3AF}',
    title: 'Готовые сценарии',
    text: 'Бизнес-стратегия, Креативный штурм, Командообразование. Или создайте свой.',
  },
  {
    icon: '\u{1F3AE}',
    title: 'Геймификация',
    text: 'XP, уровни, достижения. Превращаем серьёзные обсуждения в увлекательную игру.',
  },
  {
    icon: '\u{1F52D}',
    title: 'Аквариум AI',
    text: 'Уникальная возможность наблюдать за мыслительным процессом AI-ботов в реальном времени.',
  },
]

const SCENARIOS = [
  { icon: '\u{1F3E2}', name: 'Бизнес-стратегия', desc: 'Стратегические решения совета директоров' },
  { icon: '\u{1F4A1}', name: 'Креативный штурм', desc: 'Генерация и проработка инновационных идей' },
  { icon: '\u{1F91D}', name: 'Командообразование', desc: 'Работа с конфликтами и укрепление команды' },
]

const STATS = [
  { value: '1 200+', label: 'Пользователей' },
  { value: '8', label: 'AI-ботов' },
  { value: '15', label: 'Сценариев' },
  { value: '4.8', label: 'Средний рейтинг' },
]

export function LandingPage() {
  const theme = useAppSelector((s) => s.app.theme)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const navigate = useNavigate()

  return (
    <div className={`${theme === 'dark' ? 'bp5-dark' : ''} min-h-screen bg-odi-bg`}>
      {/* Navbar */}
      <nav className="bg-odi-surface/80 backdrop-blur border-b border-odi-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{'\u{1F3AE}'}</span>
            <span className="font-bold text-odi-text text-lg">ODI</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button intent="primary" text="Мои игры" onClick={() => navigate('/dashboard')} />
            ) : (
              <>
                <Button minimal text="Войти" onClick={() => navigate('/login')} className="!text-odi-text-muted" />
                <Button intent="primary" text="Начать бесплатно" onClick={() => navigate('/register')} />
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 50px)' }}>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <Tag intent="primary" large minimal className="mb-6">
            Организационно-деятельностные игры нового поколения
          </Tag>
          <h1 className="text-5xl font-bold text-odi-text leading-tight mb-6">
            Принимайте решения
            <br />
            <span className="text-odi-accent">вместе с AI</span>
          </h1>
          <p className="text-xl text-odi-text-muted max-w-2xl mx-auto mb-10">
            Платформа для проведения стратегических сессий, где AI-боты с уникальными
            характерами помогают вашей команде находить неожиданные решения.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              intent="primary"
              large
              text="Начать бесплатно"
              rightIcon="arrow-right"
              onClick={() => navigate('/register')}
            />
            <Button
              large
              minimal
              text="Как это работает?"
              icon="play"
              className="!text-odi-text-muted"
            />
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-odi-border bg-odi-surface/50">
          <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-odi-accent">{stat.value}</div>
                <div className="text-sm text-odi-text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-odi-text mb-3">Возможности платформы</h2>
            <p className="text-odi-text-muted max-w-xl mx-auto">
              Всё необходимое для проведения эффективных стратегических сессий
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className="!bg-odi-surface !border-odi-border !shadow-none hover:!border-odi-accent/40 transition-colors"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-odi-text mb-2">{feature.title}</h3>
                <p className="text-sm text-odi-text-muted">{feature.text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-odi-surface/50 border-y border-odi-border">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-odi-text mb-3">Как это работает</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '1', icon: '\u{1F4CB}', title: 'Выберите сценарий', text: 'Бизнес-стратегия, мозговой штурм или свой сценарий' },
                { step: '2', icon: '\u{1F916}', title: 'Соберите экипаж', text: 'Подберите AI-ботов под задачу или используйте автоподбор' },
                { step: '3', icon: '\u{1F680}', title: 'Запустите миссию', text: 'Ваша команда и AI работают вместе в реальном времени' },
                { step: '4', icon: '\u{1F3C6}', title: 'Получите результат', text: 'Карта идей, план действий и аналитика сессии' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-odi-accent/20 text-odi-accent flex items-center justify-center text-xl font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-bold text-odi-text mb-1">{item.title}</h3>
                  <p className="text-sm text-odi-text-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Scenarios */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-odi-text mb-3">Готовые сценарии</h2>
            <p className="text-odi-text-muted">Начните за минуту или создайте свой</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SCENARIOS.map((s) => (
              <Card
                key={s.name}
                interactive
                className="!bg-odi-surface !border-odi-border !shadow-none text-center hover:!border-odi-accent/40 transition-colors"
              >
                <div className="text-5xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-odi-text text-lg mb-1">{s.name}</h3>
                <p className="text-sm text-odi-text-muted">{s.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-odi-border bg-odi-surface/50">
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl font-bold text-odi-text mb-4">
              Готовы начать?
            </h2>
            <p className="text-lg text-odi-text-muted mb-8">
              Присоединяйтесь к командам, которые уже используют ODI
              для принятия стратегических решений.
            </p>
            <Button
              intent="primary"
              large
              text="Создать аккаунт"
              rightIcon="arrow-right"
              onClick={() => navigate('/register')}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-odi-border">
          <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{'\u{1F3AE}'}</span>
              <span className="text-sm text-odi-text-muted">ODI Platform</span>
            </div>
            <span className="text-xs text-odi-text-muted">2026. Организационно-деятельностные игры.</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
