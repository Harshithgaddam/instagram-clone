import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserVersion1793076049952 implements MigrationInterface {
    name = 'AddUserVersion1793076049952'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "version" integer NOT NULL DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "version"`);
    }

}
