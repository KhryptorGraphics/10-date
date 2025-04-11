import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateUserEntityWithBehavioralData1713494100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add behavioral data tracking columns to users table
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'behavioral_score',
        type: 'float',
        isNullable: true,
        default: 0,
        comment: 'Overall behavioral engagement score',
      }),
      new TableColumn({
        name: 'swipe_patterns',
        type: 'jsonb',
        isNullable: true,
        comment: 'JSON storing user swipe patterns and preferences',
      }),
      new TableColumn({
        name: 'implicit_age_preference_min',
        type: 'int',
        isNullable: true,
        comment: 'Implicit minimum age preference derived from behavior',
      }),
      new TableColumn({
        name: 'implicit_age_preference_max',
        type: 'int',
        isNullable: true,
        comment: 'Implicit maximum age preference derived from behavior',
      }),
      new TableColumn({
        name: 'implicit_distance_preference',
        type: 'int',
        isNullable: true,
        comment: 'Implicit distance preference in miles derived from behavior',
      }),
      new TableColumn({
        name: 'implicit_interest_weights',
        type: 'jsonb',
        isNullable: true,
        comment: 'JSON storing weights for interests based on behavioral analysis',
      }),
      new TableColumn({
        name: 'last_behavioral_update',
        type: 'timestamp',
        isNullable: true,
        comment: 'When the behavioral model was last updated',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove behavioral data tracking columns from users table
    await queryRunner.dropColumns('users', [
      'behavioral_score',
      'swipe_patterns',
      'implicit_age_preference_min',
      'implicit_age_preference_max',
      'implicit_distance_preference',
      'implicit_interest_weights',
      'last_behavioral_update',
    ]);
  }
}
