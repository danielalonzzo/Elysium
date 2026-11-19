import { getChatGPTUser } from '@/app/chatgpt-auth';

export async function GET() {
  const user = await getChatGPTUser();
  return Response.json({ authenticated: Boolean(user) });
}
