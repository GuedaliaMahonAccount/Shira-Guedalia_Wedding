import { notFound } from "next/navigation";
import Invitation from "../Invitation";

export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Valid image IDs (1 to 7)
  const validIds = ["1", "2", "3", "4", "5", "6", "7"];
  
  if (!validIds.includes(id)) {
    notFound();
  }

  return <Invitation photoId={id} />;
}
