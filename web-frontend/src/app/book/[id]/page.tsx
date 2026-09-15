import BookForm from "./BookForm";

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : v ?? "";
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  return (
    <BookForm
      carId={Number(id)}
      initialStart={str(sp.start)}
      initialEnd={str(sp.end)}
      initialWithDriver={str(sp.withDriver) === "1"}
    />
  );
}