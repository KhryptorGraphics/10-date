import { MigrationInterface, QueryRunner, Table, TableIndex, TableColumn } from 'typeorm';

export class CreateABTestingInfrastructure1713495000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Algorithm Variants table
    await queryRunner.createTable(
      new Table({
        name: 'algorithm_variants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'parameters',
            type: 'jsonb',
            isNullable: false,
            comment: 'JSON containing algorithm parameters and weights',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create index on name for quick lookup
    await queryRunner.createIndex(
      'algorithm_variants',
      new TableIndex({
        name: 'IDX_ALGORITHM_VARIANT_NAME',
        columnNames: ['name'],
      })
    );

    // Create AB Tests table
    await queryRunner.createTable(
      new Table({
        name: 'ab_tests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'start_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'control_variant_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Reference to the control algorithm variant',
          },
          {
            name: 'test_variant_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Reference to the test algorithm variant',
          },
          {
            name: 'traffic_allocation',
            type: 'float',
            default: 0.5,
            comment: 'Percentage of traffic allocated to test variant (0.0-1.0)',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'SCHEDULED'",
            comment: 'SCHEDULED, RUNNING, COMPLETED, CANCELLED',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create user test assignments table
    await queryRunner.createTable(
      new Table({
        name: 'user_test_assignments',
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
            isNullable: false,
          },
          {
            name: 'test_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'variant_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Algorithm variant assigned to this user',
          },
          {
            name: 'assigned_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create unique index on user_id and test_id to ensure a user is only in one variant per test
    await queryRunner.createIndex(
      'user_test_assignments',
      new TableIndex({
        name: 'IDX_USER_TEST_UNIQUE',
        columnNames: ['user_id', 'test_id'],
        isUnique: true,
      })
    );

    // Create test metrics table for storing aggregated results
    await queryRunner.createTable(
      new Table({
        name: 'test_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'test_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'variant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'metric_name',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'e.g., match_rate, response_rate, message_count',
          },
          {
            name: 'metric_value',
            type: 'float',
            isNullable: false,
          },
          {
            name: 'sample_size',
            type: 'integer',
            isNullable: false,
            comment: 'Number of users included in this metric',
          },
          {
            name: 'confidence_level',
            type: 'float',
            isNullable: true,
            comment: 'Statistical confidence level (0.0-1.0)',
          },
          {
            name: 'calculated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add a column to the swipes table to track which algorithm variant was used
    await queryRunner.addColumn(
      'swipes',
      new TableColumn({
        name: 'algorithm_variant_id',
        type: 'uuid',
        isNullable: true,
        comment: 'The algorithm variant that generated this recommendation',
      })
    );

    // Add a column to the matches table to track which algorithm variant was used
    await queryRunner.addColumn(
      'matches',
      new TableColumn({
        name: 'algorithm_variant_id',
        type: 'uuid',
        isNullable: true,
        comment: 'The algorithm variant that led to this match',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns added to existing tables
    await queryRunner.dropColumn('matches', 'algorithm_variant_id');
    await queryRunner.dropColumn('swipes', 'algorithm_variant_id');

    // Drop test metrics table
    await queryRunner.dropTable('test_metrics');

    // Drop user test assignments table
    await queryRunner.dropIndex('user_test_assignments', 'IDX_USER_TEST_UNIQUE');
    await queryRunner.dropTable('user_test_assignments');

    // Drop ab tests table
    await queryRunner.dropTable('ab_tests');

    // Drop algorithm variants table
    await queryRunner.dropIndex('algorithm_variants', 'IDX_ALGORITHM_VARIANT_NAME');
    await queryRunner.dropTable('algorithm_variants');
  }
}
