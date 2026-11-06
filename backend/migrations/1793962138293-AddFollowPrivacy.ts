import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFollowPrivacy1793962138293 implements MigrationInterface {
    name = 'AddFollowPrivacy1793962138293'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "follows" ADD "status" text NOT NULL DEFAULT 'accepted'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_private" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "chk_follows_status" CHECK ("status" IN ('pending', 'accepted', 'rejected', 'cancelled'))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "chk_follows_status"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_private"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP COLUMN "status"`);
    }

}
