import { RequestDetailView } from "@/feature/requests/components/request-detail-view";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RequestDetailView id={id} />;
}
