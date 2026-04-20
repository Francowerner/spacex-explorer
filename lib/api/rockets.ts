import { apiGet } from "./client";
import { RocketSchema, type Rocket } from "./schemas";

export async function getRocketById(id: string, signal?: AbortSignal): Promise<Rocket> {
  return apiGet(`/rockets/${encodeURIComponent(id)}`, RocketSchema, {
    signal,
    revalidate: 86400,
  });
}
