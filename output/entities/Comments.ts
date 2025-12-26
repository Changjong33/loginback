import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Posts } from "./Posts";
import { Users } from "./Users";

@Index("comments_pkey", ["id"], { unique: true })
@Entity("comments", { schema: "public" })
export class Comments {
  @Column("uuid", {
    primary: true,
    name: "id",
    default: () => "gen_random_uuid()",
  })
  id: string;

  @Column("text", { name: "content" })
  content: string;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "now()",
  })
  createdAt: Date | null;

  @ManyToOne(() => Comments, (comments) => comments.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "parent_id", referencedColumnName: "id" }])
  parent: Comments;

  @OneToMany(() => Comments, (comments) => comments.parent)
  comments: Comments[];

  @ManyToOne(() => Posts, (posts) => posts.comments, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "post_id", referencedColumnName: "id" }])
  post: Posts;

  @ManyToOne(() => Users, (users) => users.comments, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
