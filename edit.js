// edit.js
// 編輯／刪除車輛模組
// 使用瀏覽器原生 prompt/confirm 做密碼驗證，避免 Bootstrap Modal
// 尚未初始化時造成按鈕無反應。

function getVehicle(index) {
  const list = Array.isArray(window.vehicles)
    ? window.vehicles
    : (Array.isArray(window.parent?.vehicles) ? window.parent.vehicles : []);

  if (!list.length) {
    alert("目前尚未載入車輛資料，請稍候再試。");
    return null;
  }

  const v = list[index];

  if (!v) {
    alert("找不到這筆車輛資料，請重新整理頁面。");
    return null;
  }

  return v;
}

function verifyVehiclePassword(v, actionText) {
  const password = window.prompt(
    `${actionText}\n\n車號：${v.num || ""}\n使用者：${v.user || ""}\n\n請輸入當初設定的密碼：`
  );

  if (password === null) return false;

  if (String(password) !== String(v.passwd ?? "")) {
    alert("❌ 密碼錯誤，無法繼續。");
    return false;
  }

  return true;
}

function editVehicle(index) {
  const v = getVehicle(index);
  if (!v) return;

  if (!verifyVehiclePassword(v, "✏️ 修改車輛資料")) return;

  openEditForm(index);
}

function openEdit(index) {
  editVehicle(index);
}

function deleteVehicle(index) {
  const v = getVehicle(index);
  if (!v) return;

  if (!verifyVehiclePassword(v, "🗑️ 刪除車輛資料")) return;

  const ok = window.confirm(
    `確定要刪除這筆資料嗎？\n\n` +
    `車號：${v.num || ""}\n` +
    `使用者：${v.user || ""}\n` +
    `日期：${v.data || ""}\n` +
    `時段：${v["time slot"] || ""}`
  );

  if (!ok) return;

  deleteVehicleAfterPassword(index);
}

function openEditForm(index) {
  const v = getVehicle(index);
  if (!v) return;

  // add.js 會動態建立 vehicleModal。
  const open = () => {
    const modalElement = document.getElementById("vehicleModal");

    if (!modalElement) {
      alert("編輯表單尚未載入，請重新整理頁面後再試。");
      return;
    }

    window.editing = true;

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value ?? "";
    };

    set("modalTitle", "修改車輛資料");
    set("oldId", v.id);
    set("user", v.user);

    if (typeof window.updatePlateOptions === "function") {
      window.updatePlateOptions();
    }

    set("plate", v.num);
    set("ext", v.ext);
    set("passwd", v.passwd);

    // 日期只選日期
    set("datetime", typeof window.dateKey === "function"
      ? window.dateKey(v.data)
      : String(v.data || "").slice(0, 10));

    // 全天／上半天／下半天
    set("timeSlot", v["time slot"]);

    set("purpose", v.use);
    set("note", v.notes);

    // Bootstrap 有載入就使用 Bootstrap。
    if (window.bootstrap && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(modalElement).show();
    } else {
      // 沒有 Bootstrap 時仍可開啟，避免「沒反應」。
      modalElement.style.display = "block";
      modalElement.classList.add("show");
      modalElement.removeAttribute("aria-hidden");
      document.body.classList.add("modal-open");

      let backdrop = document.getElementById("manualModalBackdrop");
      if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = "manualModalBackdrop";
        backdrop.className = "modal-backdrop fade show";
        document.body.appendChild(backdrop);
      }
    }
  };

  // add.js 在 DOMContentLoaded 建立 modal；若已存在直接開啟。
  if (document.getElementById("vehicleModal")) {
    open();
  } else {
    setTimeout(open, 150);
  }
}

async function deleteVehicleAfterPassword(index) {
  const v = getVehicle(index);
  if (!v) return;

  try {
    const response = await fetch(
      `${window.API_URL}/id/${encodeURIComponent(v.id)}`,
      {
        method: "DELETE"
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await window.loadVehicles();

    if (typeof window.showSelectedMonth === "function") {
      window.showSelectedMonth();
    }

    if (typeof window.showAlert === "function") {
      window.showAlert("資料已刪除。", "success");
    } else {
      alert("資料已刪除。");
    }

  } catch (error) {
    console.error("deleteVehicle:", error);
    alert("刪除失敗：\n" + error.message);
  }
}

// 確保 inline onclick 一定找得到。
window.editVehicle = editVehicle;
window.openEdit = openEdit;
window.deleteVehicle = deleteVehicle;
window.openEditForm = openEditForm;
window.deleteVehicleAfterPassword = deleteVehicleAfterPassword;
