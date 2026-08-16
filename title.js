// title.js
document.addEventListener("DOMContentLoaded", () => {
  const title = document.getElementById("title");
  if (!title) return;

  title.innerHTML = `
    <nav class="navbar navbar-dark main-header shadow-sm">
      <div class="container-fluid px-3 px-md-5">
        <span class="navbar-brand fw-bold">🚗 車輛登記管理系統</span>
        <div class="d-flex gap-2">
          <button class="btn btn-light btn-sm" type="button"
                  data-bs-toggle="modal" data-bs-target="#calendarModal">
            📅 月曆
          </button>
          <button class="btn btn-warning btn-sm" type="button" onclick="openAdd()">
            ＋ 新增車輛
          </button>
        </div>
      </div>
    </nav>`;
});
