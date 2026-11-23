import { redirect } from "next/navigation";

// Middleware mengarahkan ke /login bila belum masuk.
export default function Home() {
  redirect("/dashboard");
}
