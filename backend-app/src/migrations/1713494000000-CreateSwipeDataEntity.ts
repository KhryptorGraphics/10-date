import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSwipeDataEntity1713494000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create SwipeData table
    await queryRunner.createTable(
      new Table({
        name: 'swipe_data',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'target_user_id',
            type: 'uuid',
          },
          {
            name: 'direction',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'swipe_time',
            type: 'int',
            isNullable: true,
            comment: 'Time spent swiping in milliseconds',
          },
          {
            name: 'profile_view_duration',
            type: 'int',
            isNullable: true,
            comment: 'Total time spent viewing the profile in milliseconds',
          },
          {
            name: 'viewed_sections',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Comma-separated list of profile sections viewed',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'swipe_data',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'swipe_data',
      new TableForeignKey({
        columnNames: ['target_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('swipe_data');
    
    if (table) {
      const foreignKeyUser = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1
      );
      const foreignKeyTargetUser = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('target_user_id') !== -1
      );
      
      if (foreignKeyUser) {
        await queryRunner.dropForeignKey('swipe_data', foreignKeyUser);
      }
      
      if (foreignKeyTargetUser) {
        await queryRunner.dropForeignKey('swipe_data', foreignKeyTargetUser);
      }
    }
    
    await queryRunner.dropTable('swipe_data');
  }
}
