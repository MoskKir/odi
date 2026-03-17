import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await dataSource.query(
    `INSERT INTO "users" ("name", "email", "passwordHash", "role")
     VALUES ($1, $2, $3, $4)
     ON CONFLICT ("email") DO NOTHING`,
    ['Admin', 'admin@odi.dev', passwordHash, 'admin'],
  );

  console.log('  -> Admin user seeded');
}
