function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

const currentUser = getUser();

if (!currentUser) {
  window.location.href = "login.html";
}

const calendar = document.getElementById("calendar");

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;
const DAYS = 7;

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
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }

  return slots;
}

async function loadReservations() {

  const { data, error } = await supabaseClient
    .from("reservations")
    .select(`
      *,
      users (
        username,
        role
      )
    `);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

async function bookSlot(date, time) {

  const user = getUser();

  if (!user) {
    alert("Tens de fazer login");
    window.location.href = "login.html";
    return;
  }

  if (user.role !== "admin") {
    const used = await getUserWeeklyReservations(user.id, date);
  
    console.log("USADO ESTA SEMANA:", used);
    console.log("LIMITE:", user.sessions_per_week);
  
    if (used >= user.sessions_per_week) {
      alert(`Já utilizaste as ${user.sessions_per_week} reservas desta semana.`);
      return;
    }
  
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

  const d = new Date(date);

  const day = d.getDay();

  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0,0,0,0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23,59,59,999);

  return {
    monday: monday.toISOString().split("T")[0],
    sunday: sunday.toISOString().split("T")[0]
  };
}

async function getUserWeeklyReservations(userId, reservationDate) {

  const { monday, sunday } = getWeekRange(reservationDate);

  const { data, error } = await supabaseClient
    .from("reservations")
    .select("id")
    .eq("user_id", userId)
    .gte("date", monday)
    .lte("date", sunday);

  if (error) {
    console.error(error);
    return 0;
  }

  return data.length;
}

async function render() {
  const user = getUser();
  const reservations = await loadReservations();

  calendar.innerHTML = "";

  const slots = createSlots();

  const table = calendar;

  // Cabeçalho
  const headerRow = document.createElement("tr");

  const emptyCorner = document.createElement("th");
  emptyCorner.textContent = "Hora";
  headerRow.appendChild(emptyCorner);

  const days = [];

  for (let i = 0; i <= DAYS; i++) {

    const date = new Date();
    date.setDate(date.getDate() + i);

    const dateStr = formatDate(date);

    days.push(dateStr);

    const th = document.createElement("th");

    th.innerHTML =
      `${date.toLocaleDateString("pt-PT", {
        weekday: "short"
      })}<br>${date.toLocaleDateString("pt-PT")}`;

    headerRow.appendChild(th);
  }

  table.appendChild(headerRow);

  // Linhas das horas
  for (const time of slots) {

    const row = document.createElement("tr");

    const timeCell = document.createElement("td");
    timeCell.textContent = time;
    timeCell.className = "time-column";

    row.appendChild(timeCell);

    for (const date of days) {

      const booked = reservations.find(
        r => r.date === date && r.time === time
      );

      const cell = document.createElement("td");

      const btn = document.createElement("button");

      btn.className = "slot-btn";

      const now = new Date();

      const slotDateTime = new Date(`${date}T${time}:00`);
      
      const pastSlot = slotDateTime < now;

      btn.textContent = time;

      if (pastSlot) {
      
        btn.textContent = "-";
        btn.classList.add("past");
        btn.disabled = true;
      
      }
       else if (booked) {

        if (booked.users?.role === "admin") {
          btn.textContent = "-";
          btn.classList.add("past");
        } else {
          btn.textContent = booked.users?.username || "Reservado";
          btn.classList.add("booked");
        }
      
        btn.disabled = true;
      
      } else {
      
        btn.onclick = async () => {

        const confirmed = confirm(
          `Confirmar reserva para ${date} às ${time}?`
        );
      
          if (!confirmed) {
            return;
          }
        
          await bookSlot(date, time);
        }; 
      }
      
      cell.appendChild(btn);

      row.appendChild(cell);
    }

    table.appendChild(row);
  }
}

render();

if (currentUser?.role === "admin") {

  document.getElementById("adminButton")
    .style.display = "inline-block";

}
