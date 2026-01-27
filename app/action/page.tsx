import { normalizeComment } from "@/app/lib/comments";
import { sql } from "@/app/lib/db";
import { revalidatePath } from "next/cache";

type CommentRow = {
  id: number;
  comment: string;
};

export default async function ActionPage() {
  async function createComment(formData: FormData) {
    "use server";
    const rawComment = formData.get("comment");
    const comment = normalizeComment(
      typeof rawComment === "string" ? rawComment : ""
    );

    if (!comment) {
      return;
    }

    await sql`INSERT INTO comments (comment) VALUES (${comment})`;
    revalidatePath("/action");
  }

  async function getComments(): Promise<CommentRow[]> {
    await sql`CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, comment TEXT)`;
    const comments = await sql`SELECT * FROM comments`;
    return comments as CommentRow[];
  }

  const comments = await getComments();

  return (
    <div>
      <h2>Server Action Example</h2>
      <form action={createComment}>
        <input type="text" name="comment" placeholder="Add a comment" />
        <button type="submit">Submit</button>
      </form>
      <h3>Comments:</h3>
      <ul>
        {comments.map((comment) => (
          <li key={comment.id}>{comment.comment}</li>
        ))}
      </ul>
    </div>
  );
}
