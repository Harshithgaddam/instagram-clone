import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountSession1791892544341 implements MigrationInterface {
    name = 'AddAccountSession1791892544341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "token_hash" text NOT NULL, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "expires_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "UQ_abaa9e068cdd390bc5210f79884" UNIQUE ("token_hash"), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_sessions_expires_at" ON "sessions"  ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "idx_sessions_user_id" ON "sessions"  ("user_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_hash" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "disabled_at" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "disabled_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sessions_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sessions_expires_at"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
    }

}
