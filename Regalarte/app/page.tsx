import { RegalarteApp } from "./RegalarteApp";
import { redirect } from "next/navigation";

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  if (query.page_id === "3") redirect("/privacidad/");
  if (query["jet-woo-builder"]) redirect("/");
  return <RegalarteApp initialPath="/" />;
}
