import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getConnection, Repository, Connection } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserEntity } from '../src/user/user.entity/user.entity';
import { SwipeEntity } from '../src/matching/match.entity/swipe.entity';
import { SwipeDataEntity } from '../src/matching/match.entity/swipe-data.entity';

describe('Migrations (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let userRepository: Repository<UserEntity>;
  let swipeRepository: Repository<SwipeEntity>;
  let swipeDataRepository: Repository<SwipeDataEntity>;

  beforeAll(async () => {
    // Create a separate test database configuration
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT) || 5432,
          username: process.env.TEST_DB_USERNAME || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'postgres',
          database: process.env.TEST_DB_NAME || 'dating_app_test',
          entities: [UserEntity, SwipeEntity, SwipeDataEntity],
          synchronize: false, // Don't use synchronize in test, we want to test migrations
          migrationsRun: true, // Run migrations automatically
          migrations: [__dirname + '/../src/migrations/*.ts'],
          logging: ['error'],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = getConnection();
    userRepository = connection.getRepository(UserEntity);
    swipeRepository = connection.getRepository(SwipeEntity);
    swipeDataRepository = connection.getRepository(SwipeDataEntity);
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  it('should have run the SwipeDataEntity migration', async () => {
    // Check if the swipe_data table exists
    const tableExists = await connection.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'swipe_data'
      );
    `);
    
    expect(tableExists[0].exists).toBe(true);
  });

  it('should have all required columns in SwipeDataEntity', async () => {
    // Get the columns from the swipe_data table
    const columns = await connection.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'swipe_data';
    `);
    
    // Extract column names into an array
    const columnNames = columns.map(col => col.column_name);
    
    // Check expected columns
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('target_user_id');
    expect(columnNames).toContain('direction');
    expect(columnNames).toContain('swipe_time');
    expect(columnNames).toContain('profile_view_duration');
    expect(columnNames).toContain('viewed_sections');
    expect(columnNames).toContain('created_at');
  });

  it('should have updated UserEntity with behavioral data fields', async () => {
    // Get the columns from the users table
    const columns = await connection.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users';
    `);
    
    // Extract column names into an array
    const columnNames = columns.map(col => col.column_name);
    
    // Check for new behavioral columns
    expect(columnNames).toContain('behavioral_score');
    expect(columnNames).toContain('swipe_patterns');
    expect(columnNames).toContain('implicit_age_preference_min');
    expect(columnNames).toContain('implicit_age_preference_max');
    expect(columnNames).toContain('implicit_distance_preference');
    expect(columnNames).toContain('implicit_interest_weights');
    expect(columnNames).toContain('last_behavioral_update');
  });

  it('should create and save SwipeDataEntity with proper relationships', async () => {
    // Create test users
    const user1 = userRepository.create({
      email: 'test1@example.com',
      password: 'hashedPassword123',
      name: 'Test User 1',
      age: 25,
    });
    
    const user2 = userRepository.create({
      email: 'test2@example.com',
      password: 'hashedPassword456',
      name: 'Test User 2',
      age: 28,
    });
    
    await userRepository.save([user1, user2]);
    
    // Create a swipe data record
    const swipeData = swipeDataRepository.create({
      user: user1,
      targetUser: user2,
      direction: 'right',
      swipeTime: 500, // 500ms
      profileViewDuration: 5000, // 5 seconds
      viewedSections: 'photo,bio,interests',
    });
    
    await swipeDataRepository.save(swipeData);
    
    // Fetch the data and validate relationships
    const savedSwipeData = await swipeDataRepository.findOne({
      where: { id: swipeData.id },
      relations: ['user', 'targetUser'],
    });
    
    expect(savedSwipeData).toBeDefined();
    expect(savedSwipeData.user.id).toBe(user1.id);
    expect(savedSwipeData.targetUser.id).toBe(user2.id);
    expect(savedSwipeData.direction).toBe('right');
    expect(savedSwipeData.swipeTime).toBe(500);
    expect(savedSwipeData.profileViewDuration).toBe(5000);
    expect(savedSwipeData.viewedSections).toBe('photo,bio,interests');
  });
});
