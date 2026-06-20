function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

const user = getUser();

if (!user) {
  window.location.href = "login.html";
}

const calendar = document.getElementById("calendar");

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;
const DAYS = 15;

function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function createSlots() {
  const slots = [];

  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }

  return slots;
}

async function loadReservations() {

  let query = supabaseClient
    .from("reservations")
    .select("*");

  if (user.role !== "admin") {
    query = query.eq("user_id", user.id);
  }

  const { data } = await query;

  return data || [];
}

async function bookSlot(date, time) {

  const user = getUser();

  if (!user) {
    alert("Tens de fazer login");
    window.location.href = "login.html";
    return;
  }

  const used = await getUserWeeklyReservations(user.id);

  if (used >= user.sessions_per_week) {
    alert("Já atingiste o limite de treinos desta semana");
    return;
  }

  const { error } = await supabaseClient
    .from("reservations")
    .insert([
      {
        user_id: user.id,
        date,
        time
      }
    ]);

  if (error) {
    alert("Erro ao reservar");
    console.error(error);
    return;
  }

  alert("Reserva feita!");
  render();
}

function getWeekRange(date) {
  const start = new Date(date);
  const day = start.getDay();

  const diffToMonday = start.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(start.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

async function getUserWeeklyReservations(userId) {

  const now = new Date();
  const { monday, sunday } = getWeekRange(now);

  const { data, error } = await supabaseClient
    .from("reservations")
    .select("*")
    .eq("user_id", userId)
    .gte("date", monday.toISOString().split("T")[0])
    .lte("date", sunday.toISOString().split("T")[0]);

  if (error) {
    console.error(error);
    return 0;
  }

  return data.length;
}

async function render() {

  const reservations = await loadReservations();

  calendar.innerHTML = "";

  for (let i = 0; i <= DAYS; i++) {

    const date = new Date();
    date.setDate(date.getDate() + i);

    const dateStr = formatDate(date);

    const day = document.createElement("div");
    day.className = "day";

    const title = document.createElement("h2");
    title.textContent = date.toDateString();

    day.appendChild(title);

    const slotsDiv = document.createElement("div");
    slotsDiv.className = "slots";

    for (const time of createSlots()) {

      const booked = reservations.find(
        r => r.date === dateStr && r.time === time
      );

      const btn = document.createElement("button");

      btn.textContent = time;
      btn.className = "slot";

      if (booked) {
        btn.classList.add("booked");
        btn.disabled = true;
      } else {
        btn.onclick = () => bookSlot(dateStr, time);
      }

      slotsDiv.appendChild(btn);
    }

    day.appendChild(slotsDiv);
    calendar.appendChild(day);
  }
}

render();
