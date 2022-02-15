import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {

  @PrimaryGeneratedColumn("uuid")
  uid: string;

  @PrimaryColumn()
  username: string;

  @Column()
  password: string;
}
