import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class InterestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;
}
