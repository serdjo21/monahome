import "server-only";

/**
 * Supabase Storage preko REST-a (bez dodatnog paketa). Sve fotografije su u javnom bucketu „media“.
 * Tajni ključ postoji samo na serveru; browser dobija jednokratni potpisan link za upload jednog fajla.
 */
const BUCKET = "media";

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Nedostaju NEXT_PUBLIC_SUPABASE_URL ili SUPABASE_SECRET_KEY.");
  return { url, key };
}

function headers(key: string): Record<string, string> {
  // Novi ključevi (sb_secret_…) idu samo u „apikey“; stari service_role JWT i u Authorization.
  return key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

/** Potpisan link (važi 2 sata) na koji browser direktno šalje fajl, mimo Vercela. */
export async function createSignedUploadUrl(path: string): Promise<string> {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/upload/sign/${BUCKET}/${encodePath(path)}`, {
    method: "POST",
    headers: { ...headers(key), "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Storage: potpisan link nije napravljen", response.status, await response.text());
    throw new Error("Upload trenutno nije moguć.");
  }
  const data = (await response.json()) as { url: string };
  return `${url}/storage/v1${data.url}`;
}

/** Da li je fajl zaista otpremljen (pre upisa u bazu). */
export async function objectExists(path: string): Promise<boolean> {
  const { url } = config();
  const response = await fetch(`${url}/storage/v1/object/public/${BUCKET}/${encodePath(path)}`, {
    method: "HEAD",
    cache: "no-store",
  });
  return response.ok;
}

/** Brisanje fajlova. Greška se samo beleži: zaostali fajl ne sme da obori akciju u adminu. */
export async function removeObjects(paths: string[]): Promise<void> {
  // Putanje sa „/“ su probne slike iz foldera public, ne iz Storage-a.
  const prefixes = paths.filter((path) => path && !path.startsWith("/"));
  if (prefixes.length === 0) return;
  try {
    const { url, key } = config();
    const response = await fetch(`${url}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: { ...headers(key), "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes }),
      cache: "no-store",
    });
    if (!response.ok) console.error("Storage: brisanje nije uspelo", response.status, await response.text());
  } catch (error) {
    console.error("Storage: brisanje nije uspelo", error);
  }
}


/** Kopija fajla u istom bucketu (dupliranje kampanje dobija svoje fotografije, ne deli ih). */
export async function copyObject(from: string, to: string): Promise<boolean> {
  try {
    const { url, key } = config();
    const response = await fetch(`${url}/storage/v1/object/copy`, {
      method: "POST",
      headers: { ...headers(key), "Content-Type": "application/json" },
      body: JSON.stringify({ bucketId: BUCKET, sourceKey: from, destinationKey: to }),
      cache: "no-store",
    });
    if (!response.ok) console.error("Storage: kopiranje nije uspelo", response.status, await response.text());
    return response.ok;
  } catch (error) {
    console.error("Storage: kopiranje nije uspelo", error);
    return false;
  }
}