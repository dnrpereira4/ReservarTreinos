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
    alert("Faz login primeiro");
    window.location.href = "login.html";
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
