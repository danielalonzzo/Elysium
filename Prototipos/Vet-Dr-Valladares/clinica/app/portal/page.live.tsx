import { requireChatGPTUser } from "../chatgpt-auth";
import ClinicApp from "@/src/features/crm/ClinicApp";
export const dynamic = "force-dynamic";
export default async function Portal(){ await requireChatGPTUser("/portal"); return <ClinicApp mode="portal" />; }
