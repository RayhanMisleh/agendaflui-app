import { api } from "./index";

// Banners no ar hoje, na ordem da conta: [{ id, title, imageUrl, linkUrl }].
export async function listBanners() {
  const response = await api.http.get("/banners");
  return response.data.items;
}
