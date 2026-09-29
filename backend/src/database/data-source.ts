import 'dotenv/config';
import 'reflect-metadata';

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { DataSource } from 'typeorm';

import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { PostMedia } from './entities/post-media.entity';
import { Like } from './entities/like.entity';
import { Follow } from './entities/follow.entity';

async function runSeed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required to run the seed.',
    );
  }

  const seedPath = resolve(
    process.cwd(),
    'db',
    'seed.sql',
  );

  const seedSql = await readFile(seedPath, 'utf8');

  const dataSource = new DataSource({
    type: 'postgres',

    url: databaseUrl,

    connectTimeoutMS: Number(
      process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 5000,
    ),

    synchronize: false,

    logging: false,

    entities: [
      User,
      Post,
      PostMedia,
      Like,
      Follow,
    ],
  });

  try {
    await dataSource.initialize();

    console.log('Connected to PostgreSQL.');

    await dataSource.query(seedSql);

    console.log(
      'Deterministic seed completed successfully.',
    );
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('PostgreSQL connection closed.');
    }
  }
}

runSeed().catch((error) => {
  console.error('Deterministic seed failed.');
  console.error(error);
  process.exitCode = 1;
});