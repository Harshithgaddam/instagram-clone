import {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

export class UpdatePostMediaImageUrls1789909500000
  implements MigrationInterface
{
  name = 'UpdatePostMediaImageUrls1789909500000';

  public async up(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      UPDATE post_media pm
      SET images = (
        SELECT jsonb_agg(
          jsonb_set(
            jsonb_set(
              image,
              '{small_url}',
              to_jsonb(
                CASE ((ordinality - 1) % 10)
                  WHEN 0 THEN 'https://picsum.photos/id/10/600/400'
                  WHEN 1 THEN 'https://picsum.photos/id/20/600/400'
                  WHEN 2 THEN 'https://picsum.photos/id/30/600/400'
                  WHEN 3 THEN 'https://picsum.photos/id/40/600/400'
                  WHEN 4 THEN 'https://picsum.photos/id/50/600/400'
                  WHEN 5 THEN 'https://picsum.photos/id/60/600/400'
                  WHEN 6 THEN 'https://picsum.photos/id/70/600/400'
                  WHEN 7 THEN 'https://picsum.photos/id/80/600/400'
                  WHEN 8 THEN 'https://picsum.photos/id/90/600/400'
                  ELSE 'https://picsum.photos/id/100/600/400'
                END::text
              ),
              true
            ),
            '{large_url}',
            to_jsonb(
              CASE ((ordinality - 1) % 10)
                WHEN 0 THEN 'https://picsum.photos/id/10/1200/800'
                WHEN 1 THEN 'https://picsum.photos/id/20/1200/800'
                WHEN 2 THEN 'https://picsum.photos/id/30/1200/800'
                WHEN 3 THEN 'https://picsum.photos/id/40/1200/800'
                WHEN 4 THEN 'https://picsum.photos/id/50/1200/800'
                WHEN 5 THEN 'https://picsum.photos/id/60/1200/800'
                WHEN 6 THEN 'https://picsum.photos/id/70/1200/800'
                WHEN 7 THEN 'https://picsum.photos/id/80/1200/800'
                WHEN 8 THEN 'https://picsum.photos/id/90/1200/800'
                ELSE 'https://picsum.photos/id/100/1200/800'
              END::text
            ),
            true
          )
          ORDER BY ordinality
        )
        FROM jsonb_array_elements(pm.images)
          WITH ORDINALITY AS x(image, ordinality)
      );
    `);
  }

  public async down(
    queryRunner: QueryRunner,
  ): Promise<void> {
    // Restore the original fixture URLs here if rollback
    // to the previous seed data is required.
  }
}