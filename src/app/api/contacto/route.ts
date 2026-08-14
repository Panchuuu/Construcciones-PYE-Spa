import { handleContactRequest } from "@/backend/api/contact.handler";

/** La ruta solo delega en el handler del backend. */
export async function POST(request: Request) {
  return handleContactRequest(request);
}
