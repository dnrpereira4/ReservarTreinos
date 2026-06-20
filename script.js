const calendar = document.getElementById("calendar");

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;
const DAYS_AHEAD = 15;

async function loadReservations() {

  const { data, error } = await supabaseClient
    .from("reservations")
    .select("*");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function createHourSlots() {

  const slots = [];

  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {

    slots.push(
      `${String(h).padStart(2, "0")}:00`
    );
  }

  return slots;
}

async function bookSlot(date, time) {

  const name = prompt("Nome:");

  if (!name) return;

  const { error } = await supabaseClient
    .from("reservations")
    .insert([
      {
        date,
        time,
        name
      }
    ]);

  if (error) {
    alert("Erro ao reservar");
    console.error(error);
    return;
  }

  alert("Reserva criada!");

  render();
}

async function render() {

  calendar.innerHTML = "";

  const reservations = await loadReservations();

  for (let i = 0; i <= DAYS_AHEAD; i++) {

    const date = new Date();

    date.setDate(date.getDate() + i);

    const dateString = formatDate(date);

    const dayDiv = document.createElement("div");
    dayDiv.className = "day";

    const title = document.createElement("h2");
    title.textContent =
      date.toLocaleDateString("pt-PT", {
        weekday: "long",
        day: "numeric",
        month: "long"
      });

    dayDiv.appendChild(title);

    const slotsDiv = document.createElement("div");
    slotsDiv.className = "slots";

    for (const time of createHourSlots()) {

      const booked = reservations.find(
        r =>
          r.date === dateString &&
          r.time === time
      );

      const button = document.createElement("button");

      button.textContent = time;

      button.className = "slot";

      if (booked) {

        button.classList.add("booked");

        button.disabled = true;

      } else {

        button.onclick = () =>
          bookSlot(dateString, time);
      }

      slotsDiv.appendChild(button);
    }

    dayDiv.appendChild(slotsDiv);

    calendar.appendChild(dayDiv);
  }
}

render();