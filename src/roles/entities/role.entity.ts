import { Users } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Index('roles_name_key', ['name'], { unique: true })
@Entity('roles', { schema: 'public' })
export class Roles {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('character varying', { name: 'name', unique: true, length: 50 })
  name: string;

  @ManyToMany(() => Users, (user) => user.roles)
  users: Users[];
}
