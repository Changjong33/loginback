import { Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";
import { Users } from "./Users";

@Index("user_profile_images_pkey", ["userId"], { unique: true })
@Entity("user_profile_images", { schema: "public" })
export class UserProfileImages {
  @Column("uuid", { primary: true, name: "user_id" })
  userId: string;

  @Column("character varying", { name: "image_url", length: 500 })
  imageUrl: string;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @Column("timestamp without time zone", {
    name: "updated_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date | null;

  @OneToOne(() => Users, (users) => users.userProfileImages, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
