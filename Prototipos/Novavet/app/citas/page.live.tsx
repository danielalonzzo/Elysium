import { requireChatGPTUser } from "../chatgpt-auth";
import Booking from "@/src/features/booking/Booking";
export const dynamic = "force-dynamic";
export default async function Citas(){ await requireChatGPTUser("/citas"); return <Booking/>; }
