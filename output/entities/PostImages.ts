import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Posts } from "./Posts";

@Index("post_images_pkey", ["id"], { unique: true })
@Entity("post_images", { schema: "public" })
export class PostImages {
  @Column("uuid", {
    primary: true,
    name: "id",
    default: () => "gen_random_uuid()",
  })
  id: string;

  @Column("text", { name: "image_url" })
  imageUrl: string;

  @Column("integer", { name: "sort_order" })
  sortOrder: number;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "now()",
  })
  createdAt: Date | null;

  @ManyToOne(() => Posts, (posts) => posts.postImages, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "post_id", referencedColumnName: "id" }])
  post: Posts;
}
