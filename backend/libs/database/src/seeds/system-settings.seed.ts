import { DataSource } from 'typeorm';

interface SettingSeed {
  key: string;
  value: any;
}

const settings: SettingSeed[] = [
  { key: 'platform_name', value: 'ODI Platform' },
  { key: 'max_players_per_session', value: 0 },
  { key: 'default_model', value: 'anthropic/claude-sonnet-4-20250514' },
  { key: 'default_language', value: 'ru' },
  {
    key: 'features',
    value: {
      registration: true,
      aquarium: true,
      gamification: true,
      voice_input: false,
      pdf_export: false,
    },
  },
];

export async function seedSystemSettings(dataSource: DataSource): Promise<void> {
  for (const s of settings) {
    await dataSource.query(
      `INSERT INTO "system_settings" ("key", "value")
       VALUES ($1, $2::jsonb)
       ON CONFLICT ("key") DO UPDATE SET
         "value" = EXCLUDED."value",
         "updatedAt" = now()`,
      [s.key, JSON.stringify(s.value)],
    );
  }

  console.log('  -> System settings seeded');
}
