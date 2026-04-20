import { apiGet } from "./client";
import { LaunchpadSchema, type Launchpad } from "./schemas";

export async function getLaunchpadById(id: string, signal?: AbortSignal): Promise<Launchpad> {
  return apiGet(`/launchpads/${encodeURIComponent(id)}`, LaunchpadSchema, {
    signal,
    revalidate: 86400,
  });
}
