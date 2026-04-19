import { RoomLobby } from "@/components/room-lobby";

type RoomPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function RoomPage({
  params,
}: RoomPageProps) {
  const { code } = await params;

  return <RoomLobby code={code} />;
}
