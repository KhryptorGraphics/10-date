import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Interest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;
}
