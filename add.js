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
            <label class="form-label fw-bold">日期 *</label>
            <input id="datetime" type="date" class="form-control" required>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">時段 *</label>
            <select id="timeSlot" class="form-select" required>
              <option value="" selected disabled>請選擇時段</option>
              <option value="全天">全天</option>
              <option value="上半天">上半天</option>
              <option value="下半天">下半天</option>
            </select>
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

function checkVehicleDateConflict(num, data, timeSlot, oldId = "") {
  if (!Array.isArray(vehicles)) return [];

  const targetDate = dateKey(data);
  if (!targetDate) return [];

  return vehicles.filter(v => {
    if (oldId && String(v.id) === String(oldId)) return false;

    const sameVehicle =
      String(v.num || "").trim() === String(num || "").trim();

    const sameDate = dateKey(v.data) === targetDate;
    const oldSlot = String(v["time slot"] || "").trim();

    // 全天與同一天任何時段衝突。
    // 上半天只與上半天／全天衝突。
    // 下半天只與下半天／全天衝突。
    const slotConflict =
      timeSlot === "全天" ||
      oldSlot === "全天" ||
      timeSlot === oldSlot;

    return sameVehicle && sameDate && slotConflict;
  });
}

async function saveVehicle(e) {
  e.preventDefault();

  const oldId = document.getElementById("oldId").value.trim();

  const data = {
    user: document.getElementById("user").value.trim(),
    num: document.getElementById("plate").value.trim(),
    ext: document.getElementById("ext").value.trim(),
    passwd: document.getElementById("passwd").value,
    data: document.getElementById("datetime").value,
    "time slot": document.getElementById("timeSlot").value,
    use: document.getElementById("purpose").value.trim(),
    notes: document.getElementById("note").value.trim()
  };

  if (!data.user || !data.num || !data.passwd || !data.data || !data["time slot"]) {
    showAlert("請填寫使用者、車號、密碼、日期及時段。", "warning");
    return;
  }

  // 同一車號、同一天已有人登記時，禁止重複借用
  const conflicts = checkVehicleDateConflict(
    data.num,
    data.data,
    data["time slot"],
    oldId
  );

  if (conflicts.length > 0) {
    const first = conflicts[0];

    showAlert(
      `⚠️ 車輛 ${data.num} 在 ${dateKey(data.data)} 的「${data["time slot"]}」已有登記！使用者：${first.user || "未填寫"}，時段：${first["time slot"] || "未填寫"}。`,
      "warning"
    );

    alert(
      `⚠️ 車輛已有人借用

` +
      `車號：${data.num}
` +
      `日期：${dateKey(data.data)}
` +
      `使用者：${first.user || "未填寫"}
` +
      `時間：${first.data || "未填寫"}

` +
      `此筆資料不會儲存。`
    );

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
