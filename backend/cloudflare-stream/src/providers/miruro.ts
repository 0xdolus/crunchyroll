import type { Env } from "../env";

export async function miruroBase(env: Env): Promise<string> {
  return env.MIRURO_API;
}
