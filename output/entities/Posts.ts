import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Comments } from "./Comments";
import { PostImages } from "./PostImages";
import { Users } from "./Users";

@Index("posts_pkey", ["id"], { unique: true })
@Entity("posts", { schema: "public" })
export class Posts {
  @Column("uuid", {
    primary: true,
    name: "id",
    default: () => "gen_random_uuid()",
  })
  id: string;

  @Column("text", { name: "caption", nullable: true })
  caption: string | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "now()",
  })
  createdAt: Date | null;

  @OneToMany(() => Comments, (comments) => comments.post)
  comments: Comments[];

  @OneToMany(() => PostImages, (postImages) => postImages.post)
  postImages: PostImages[];

  @ManyToOne(() => Users, (users) => users.posts, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
