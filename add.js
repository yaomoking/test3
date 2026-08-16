// add.js
// 新增／修改車輛模組
// 依賴 index.html 提供：API_URL、vehicles、editing、loadVehicles、dateKey、
// updatePlateOptions、showSelectedMonth、showAlert、setNow 等全域函式。

document.addEventListener("DOMContentLoaded", () => {
  const modalHTML = `
<!-- 新增／修改車輛 Modal -->
<div class="modal fade" id="vehicleModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <form id="vehicleForm">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title" id="modalTitle">新增車輛</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <input type="hidden" id="oldId">

          <div class="mb-3">
            <label class="form-label fw-bold">使用者 *</label>
            <input id="user" class="form-control" required>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">車號 *</label>
            <select id="plate" class="form-select" required>
              <option value="" selected disabled>請選擇車號</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">分機</label>
            <input id="ext" type="text" class="form-control" placeholder="請輸入分機">
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">密碼 *</label>
            <input id="passwd" type="password" class="form-control"
                   placeholder="請輸入密碼" required>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">時間／日期 *</label>
            <input id="datetime" type="datetime-local" class="form-control" required>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">用途</label>
            <input id="purpose" class="form-control" placeholder="請輸入用途">
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">備註</label>
            <textarea id="note" class="form-control" rows="3"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
          <button type="submit" class="btn btn-primary">儲存資料</button>
        </div>
      </form>
    </div>
  </div>
</div>`;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document.getElementById("vehicleForm").addEventListener("submit", saveVehicle);
});

function openAdd() {
  editing = false;

  document.getElementById("modalTitle").textContent = "新增登記車輛";
  document.getElementById("vehicleForm").reset();
  document.getElementById("oldId").value = "";

  if (typeof updatePlateOptions === "function") {
    updatePlateOptions();
  }

  if (typeof setNow === "function") {
    setNow();
  }

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("vehicleModal")
  ).show();
}

async function saveVehicle(e) {
  e.preventDefault();

  const oldId = document.getElementById("oldId").value.trim();

  const data = {
    user: document.getElementById("user").value.trim(),
    num: document.getElementById("plate").value.trim(),
    ext: document.getElementById("ext").value.trim(),
    passwd: document.getElementById("passwd").value,
    data: document.getElementById("datetime").value.replace("T", " "),
    use: document.getElementById("purpose").value.trim(),
    notes: document.getElementById("note").value.trim()
  };

  if (!data.user || !data.num || !data.passwd || !data.data) {
    showAlert("請填寫使用者、車號、密碼及時間／日期。", "warning");
    return;
  }

  try {
    let response;

    if (editing) {
      response = await fetch(
        `${API_URL}/id/${encodeURIComponent(oldId)}`,
        {
          method: "PATCH",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({data})
        }
      );
    } else {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({data})
      });
    }

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("vehicleModal")
    ).hide();

    const wasEditing = editing;

    await loadVehicles();

    const key = dateKey(data.data);
    if (key) {
      currentMonth = key.substring(0, 7);
    }

    const picker = document.getElementById("monthPicker");
    if (picker) picker.value = currentMonth;

    showSelectedMonth();

    showAlert(
      wasEditing ? "資料已修改。" : "車輛登記已新增。",
      "success"
    );

  } catch (error) {
    console.error(error);
    showAlert(
      "儲存失敗，請檢查 SheetDB API 或寫入權限。",
      "danger"
    );
  }
}
