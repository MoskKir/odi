import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Info, Eye, Save } from 'lucide-react'

export function SystemPage() {
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Настройки системы</h2>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Изменения настроек вступят в силу после сохранения.
        </AlertDescription>
      </Alert>

      {/* General */}
      <Card className="bg-card border-border shadow-none p-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Общие</h3>
        <div className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Название платформы</Label>
            <Input defaultValue="ODI Platform" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Максимум игроков в сессии</Label>
            <Input type="number" defaultValue="10" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Язык по умолчанию</Label>
            <Select defaultValue="ru">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* AI */}
      <Card className="bg-card border-border shadow-none p-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">AI-конфигурация</h3>
        <div className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Модель по умолчанию</Label>
            <Select defaultValue="claude-sonnet">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-opus">Claude Opus</SelectItem>
                <SelectItem value="claude-sonnet">Claude Sonnet</SelectItem>
                <SelectItem value="claude-haiku">Claude Haiku</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">API ключ</Label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                defaultValue="sk-ant-xxxxx"
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Макс. токенов на ответ</Label>
            <Input type="number" defaultValue="2048" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Temperature</Label>
            <Input type="number" defaultValue="0.7" step="0.1" min="0" max="2" />
          </div>
        </div>
      </Card>

      {/* Features */}
      <Card className="bg-card border-border shadow-none p-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Функции</h3>
        <div className="space-y-4 max-w-lg">
          <div className="flex items-center justify-between">
            <Label>Регистрация новых пользователей</Label>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label>Аквариум (видимость мыслей AI)</Label>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label>Геймификация (XP, уровни)</Label>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label>Голосовой ввод (бета)</Label>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <Label>Экспорт в PDF</Label>
            <Switch />
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="bg-card border-destructive/30 shadow-none p-5">
        <h3 className="text-sm font-bold text-destructive uppercase tracking-wider mb-4">Опасная зона</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-foreground">Очистить кеш</div>
              <div className="text-xs text-muted-foreground">Сбросить все закешированные данные</div>
            </div>
            <Button variant="outline" className="border-amber-500 text-amber-500 hover:bg-amber-500/10">Очистить</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-foreground">Сбросить все сессии</div>
              <div className="text-xs text-muted-foreground">Завершить все активные сессии</div>
            </div>
            <Button variant="destructive">Сбросить</Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button size="lg">
          <Save className="h-4 w-4 mr-2" />
          Сохранить настройки
        </Button>
      </div>
    </div>
  )
}
