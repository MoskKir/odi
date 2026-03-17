import { Card, FormGroup, InputGroup, Switch, Button, HTMLSelect, Callout } from '@blueprintjs/core'

export function SystemPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-odi-text">Настройки системы</h2>

      <Callout intent="primary" icon="info-sign" className="!text-sm">
        Изменения настроек вступят в силу после сохранения.
      </Callout>

      {/* General */}
      <Card className="!bg-odi-surface !border-odi-border !shadow-none">
        <h3 className="text-sm font-bold text-odi-text uppercase tracking-wider mb-4">Общие</h3>
        <div className="space-y-4 max-w-lg">
          <FormGroup label="Название платформы" className="[&_.bp5-label]:!text-odi-text-muted">
            <InputGroup defaultValue="ODI Platform" />
          </FormGroup>
          <FormGroup label="Максимум игроков в сессии" className="[&_.bp5-label]:!text-odi-text-muted">
            <InputGroup type="number" defaultValue="10" />
          </FormGroup>
          <FormGroup label="Язык по умолчанию" className="[&_.bp5-label]:!text-odi-text-muted">
            <HTMLSelect defaultValue="ru">
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </HTMLSelect>
          </FormGroup>
        </div>
      </Card>

      {/* AI */}
      <Card className="!bg-odi-surface !border-odi-border !shadow-none">
        <h3 className="text-sm font-bold text-odi-text uppercase tracking-wider mb-4">AI-конфигурация</h3>
        <div className="space-y-4 max-w-lg">
          <FormGroup label="Модель по умолчанию" className="[&_.bp5-label]:!text-odi-text-muted">
            <HTMLSelect defaultValue="claude-sonnet">
              <option value="claude-opus">Claude Opus</option>
              <option value="claude-sonnet">Claude Sonnet</option>
              <option value="claude-haiku">Claude Haiku</option>
            </HTMLSelect>
          </FormGroup>
          <FormGroup label="API ключ" className="[&_.bp5-label]:!text-odi-text-muted">
            <InputGroup type="password" defaultValue="sk-ant-xxxxx" rightElement={<Button minimal icon="eye-open" />} />
          </FormGroup>
          <FormGroup label="Макс. токенов на ответ" className="[&_.bp5-label]:!text-odi-text-muted">
            <InputGroup type="number" defaultValue="2048" />
          </FormGroup>
          <FormGroup label="Temperature" className="[&_.bp5-label]:!text-odi-text-muted">
            <InputGroup type="number" defaultValue="0.7" step="0.1" min="0" max="2" />
          </FormGroup>
        </div>
      </Card>

      {/* Features */}
      <Card className="!bg-odi-surface !border-odi-border !shadow-none">
        <h3 className="text-sm font-bold text-odi-text uppercase tracking-wider mb-4">Функции</h3>
        <div className="space-y-3 max-w-lg">
          <Switch defaultChecked label="Регистрация новых пользователей" className="!mb-0" />
          <Switch defaultChecked label="Аквариум (видимость мыслей AI)" className="!mb-0" />
          <Switch defaultChecked label="Геймификация (XP, уровни)" className="!mb-0" />
          <Switch label="Голосовой ввод (бета)" className="!mb-0" />
          <Switch label="Экспорт в PDF" className="!mb-0" />
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="!bg-odi-surface !border-odi-danger/30 !shadow-none">
        <h3 className="text-sm font-bold text-odi-danger uppercase tracking-wider mb-4">Опасная зона</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-odi-text">Очистить кеш</div>
              <div className="text-xs text-odi-text-muted">Сбросить все закешированные данные</div>
            </div>
            <Button intent="warning" outlined text="Очистить" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-odi-text">Сбросить все сессии</div>
              <div className="text-xs text-odi-text-muted">Завершить все активные сессии</div>
            </div>
            <Button intent="danger" outlined text="Сбросить" />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button intent="primary" large text="Сохранить настройки" icon="floppy-disk" />
      </div>
    </div>
  )
}
