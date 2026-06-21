const SUPABASE_URL = "https://kpcmfblvdkpojrwjqorz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwY21mYmx2ZGtwb2pyd2pxb3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NDE1OTQsImV4cCI6MjA5NzUxNzU5NH0.AgjDrNEYGyega75VVx5Mib9V4b2mH0ZkzcJaaunwng4";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "admin") {
  window.location.href = "index.html";
}

async function loadUsers() {

  const { data, error } = await supabaseClient
    .from("users")
    .select("*")
    .order("id");

  if (error) {
    console.error(error);
    return;
  }

  renderUsers(data);
}

function renderUsers(users) {

  const tbody =
    document.querySelector("#usersTable tbody");

  tbody.innerHTML = "";

  users.forEach(u => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${u.username}</td>

      <td>
        <input
          value="${u.password}"
          data-id="${u.id}"
          class="password">
      </td>

      <td>
        <input
          value="${u.role}"
          data-id="${u.id}"
          class="role">
      </td>

      <td>
        <input
          type="number"
          value="${u.sessions_per_week}"
          data-id="${u.id}"
          class="sessions">
      </td>

      <td>

        <button onclick="updateUser(${u.id})">
          Guardar
        </button>

        <button onclick="deleteUser(${u.id})">
          Apagar
        </button>

      </td>
    `;

    tbody.appendChild(row);

  });
}

async function createUser() {

  const username =
    document.getElementById("username").value;

  const password =
    document.getElementById("password").value;

  const role =
    document.getElementById("role").value;

  const sessions =
    Number(document.getElementById("sessions").value);

  const { data: existing } = await supabaseClient
    .from("users")
    .select("id")
    .eq("username", username)
    .limit(1);
  
  if (existing.length > 0) {
    alert("Já existe um utilizador com esse username.");
    return;
  }

  const { error } = await supabaseClient
    .from("users")
    .insert([
      {
        username,
        password,
        role,
        sessions_per_week: sessions
      }
    ]);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  loadUsers();
}

async function updateUser(id) {

  const row =
    [...document.querySelectorAll("tr")]
      .find(r =>
        r.innerHTML.includes(`updateUser(${id})`)
      );

  const password =
    row.querySelector(".password").value;

  const role =
    row.querySelector(".role").value;

  const sessions =
    Number(
      row.querySelector(".sessions").value
    );

  const { error } = await supabaseClient
    .from("users")
    .update({
      password,
      role,
      sessions_per_week: sessions
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  alert("Guardado");
}

async function deleteUser(id) {

  if (!confirm("Apagar utilizador?")) {
    return;
  }

  const { error } = await supabaseClient
    .from("users")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  loadUsers();
}

async function loadReservations() {

  const { data, error } = await supabaseClient
    .from("reservations")
    .select(`
      date,
      time,
      users (
        username
      )
    `)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  renderReservations(data);
}

loadUsers();
