const reportsBody = document.getElementById("reportsBody");

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB");
}

async function loadReports() {
  try {
    const res = await fetch("api/my-reports.php");
    const data = await res.json();

    if (!data.success) {
      reportsBody.innerHTML = `
        <tr>
          <td colspan="5">${data.message}</td>
        </tr>
      `;
      return;
    }

    if (data.reports.length === 0) {
      reportsBody.innerHTML = `
        <tr>
          <td colspan="5">No reports found.</td>
        </tr>
      `;
      return;
    }

    reportsBody.innerHTML = data.reports.map(report => `
      <tr>
        <td><b>${report.game_name}</b></td>
        <td>${report.title}</td>
        <td>${report.description}</td>
        <td>${formatDate(report.date_reported)}</td>
        <td class="status">${report.status}</td>
      </tr>
    `).join("");

  } catch (error) {
    reportsBody.innerHTML = `
      <tr>
        <td colspan="5">Cannot load reports.</td>
      </tr>
    `;
  }
}

loadReports();