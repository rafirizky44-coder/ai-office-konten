
import { supabase } from "./supabase-client.js";

// 1. Memeriksa sesi login
async function checkSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Gagal memeriksa sesi:", error.message);
    return null;
  }

  return data.session;
}

// 2. Login
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  return data.user;
}

// 3. Logout
export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;

  window.location.reload();
}

// 4. Mengambil data konten dari database
export async function loadContents() {
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

// 5. Sinkronisasi perubahan konten secara realtime
export function subscribeContents(onChange) {
  return supabase
    .channel("content-items-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "content_items"
      },
      onChange
    )
    .subscribe();
}

// 6. Upload file ke Storage
export async function uploadAsset(file, contentId) {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError) throw userError;
  if (!userData.user) throw new Error("Silakan login terlebih dahulu.");

  const userId = userData.user.id;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${contentId}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from("content-assets")
    .upload(path, file, {
      upsert: false
    });

  if (error) throw error;

  return data;
}

// 7. Menjaga status autentikasi
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Status autentikasi:", event);

  if (!session) {
    // Arahkan ke tampilan login aplikasi.
    document.body.dataset.auth = "signed-out";
  } else {
    document.body.dataset.auth = "signed-in";
  }
});

// Pemeriksaan awal
checkSession().then(session => {
  if (session) {
    document.body.dataset.auth = "signed-in";
  } else {
    document.body.dataset.auth = "signed-out";
  }
});
