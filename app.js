/* ═══════════════════════════════════════════════════════════
   app.js — نسخه کاملاً پویا و متصل به فایربیس (حذف کامل data.js)
   شامل تمام بخش‌های گالری، سبد خرید، سفارشات و پنل مدیریت ادمین
   ═══════════════════════════════════════════════════════════ */

// تعریف متغیرهای سراسری به صورت پیش‌فرض خالی برای جلوگیری از خطای رندر اولیه
window.DATA = {};

// ══════════════════════════════════════════════════════
// ۱. لود آنی و زنده داده‌ها از فایربیس به محض باز شدن سایت
// ══════════════════════════════════════════════════════
if (window.db) {
  // استفاده از .on باعث می‌شود هر تغییری در ادمین، بلافاصله بدون رفرش در صفحه مشتری اعمال شود
  window.db.ref("siteData/DATA").on("value", (snapshot) => {
    const remoteData = snapshot.val();
    if (remoteData) {
      window.DATA = remoteData;
      console.log("✅ داده‌ها با موفقیت از فایربیس دریافت و بروزرسانی شدند.");

      // اجرای توابع اصلی سایت پس از دریافت داده‌ها
      initApp();
      if (typeof refreshAllSelectors === "function") refreshAllSelectors();
    } else {
      console.warn("⚠️ هیچ داده‌ای در فایربیس یافت نشد. دیتابیس خالی است.");
    }
  });
} else {
  console.error(
    "❌ فایربیس لود نشده است! لطفاً تنظیمات تگ اسکریپت فایربیس را در index.html بررسی کنید.",
  );
}

function initApp() {
  createCategoryTabs();
  // لود اولیه روی اولین دسته‌بندی موجود
  const firstCat = Object.keys(window.DATA)[0];
  if (firstCat) {
    switchCategory(firstCat);
  }
  updateCartUI();
}

/* ════════ CLIENT SIDE GALLERY & CART (کدهای اصلی سایت شما) ════════ */

// ایجاد تب‌های دسته‌بندی در بالای سایت
function createCategoryTabs() {
  const container = document.getElementById("categoryTabs");
  if (!container) return;
  container.innerHTML = "";

  Object.keys(window.DATA).forEach((key) => {
    const cat = window.DATA[key];
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.setAttribute("data-category", key);
    btn.textContent = cat.label || key;
    btn.addEventListener("click", () => switchCategory(key));
    container.appendChild(btn);
  });
}

// سوئیچ بین دسته‌بندی‌ها
function switchCategory(catKey) {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((t) => {
    if (t.getAttribute("data-category") === catKey) {
      t.classList.add("active");
    } else {
      t.classList.remove("active");
    }
  });

  const grid = document.getElementById("photoGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const catData = window.DATA[catKey];
  if (!catData || !catData.photos || catData.photos.length === 0) {
    grid.innerHTML =
      '<p class="no-photos">هیچ عکسی در این مناسبت وجود ندارد.</p>';
    return;
  }

  catData.photos.forEach((photo) => {
    const card = document.createElement("div");
    card.className = "photo-card";

    // افکت سه‌بعدی حرکت ماوس روی کارت‌ها
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      const angleX = (yc - y) / 10;
      const angleY = (x - xc) / 10;
      card.style.transform = `perspective(600px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.02)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform =
        "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)";
    });

    const imgWrapper = document.createElement("div");
    imgWrapper.className = "img-wrapper";

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.title || "";
    img.loading = "lazy";

    // باز کردن لایت‌باکس با کلیک روی عکس
    img.addEventListener("click", () =>
      openLightbox(photo.src, photo.title || ""),
    );

    imgWrapper.appendChild(img);
    card.appendChild(imgWrapper);

    // بخش عنوان و دکمه انتخاب عکس
    const info = document.createElement("div");
    info.className = "photo-info";

    const title = document.createElement("h3");
    title.className = "photo-title";
    title.textContent = photo.title || "بدون عنوان";
    info.appendChild(title);

    const selectBtn = document.createElement("button");
    const inCart = cartContains(photo.src);
    selectBtn.className = inCart ? "select-btn selected" : "select-btn";
    selectBtn.innerHTML = inCart
      ? '<span class="icon">✓</span> انتخاب شده'
      : '<span class="icon">+</span> انتخاب عکس';

    selectBtn.addEventListener("click", () => {
      toggleCart(photo);
      const nowIn = cartContains(photo.src);
      selectBtn.className = nowIn ? "select-btn selected" : "select-btn";
      selectBtn.innerHTML = nowIn
        ? '<span class="icon">✓</span> انتخاب شده'
        : '<span class="icon">+</span> انتخاب عکس';
    });

    info.appendChild(selectBtn);
    card.appendChild(info);
    grid.appendChild(card);
  });
}

// ── Lightbox Logic ──
let currentLightboxImg = "";
function openLightbox(src, title) {
  currentLightboxImg = src;
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbTitle = document.getElementById("lightboxTitle");
  if (!lb || !lbImg) return;

  lbImg.src = src;
  if (lbTitle) lbTitle.textContent = title;
  lb.classList.add("active");

  const lbSelectBtn = document.getElementById("lightboxSelectBtn");
  if (lbSelectBtn) {
    const inCart = cartContains(src);
    lbSelectBtn.className = inCart
      ? "lightbox-select-btn selected"
      : "lightbox-select-btn";
    lbSelectBtn.textContent = inCart
      ? "✓ عکس انتخاب شده است"
      : "+ انتخاب این عکس";
  }
}

window.closeLightbox = function () {
  const lb = document.getElementById("lightbox");
  if (lb) lb.classList.remove("active");
};

window.toggleLightboxSelect = function () {
  if (!currentLightboxImg) return;
  let foundPhoto = null;

  Object.keys(window.DATA).forEach((catKey) => {
    const p = window.DATA[catKey].photos?.find(
      (x) => x.src === currentLightboxImg,
    );
    if (p) foundPhoto = p;
  });

  if (!foundPhoto) {
    foundPhoto = { src: currentLightboxImg, title: "" };
  }

  toggleCart(foundPhoto);
  const lbSelectBtn = document.getElementById("lightboxSelectBtn");
  if (lbSelectBtn) {
    const inCart = cartContains(currentLightboxImg);
    lbSelectBtn.className = inCart
      ? "lightbox-select-btn selected"
      : "lightbox-select-btn";
    lbSelectBtn.textContent = inCart
      ? "✓ عکس انتخاب شده است"
      : "+ انتخاب این عکس";
  }

  const activeTab = document.querySelector(".tab-btn.active");
  if (activeTab) {
    switchCategory(activeTab.getAttribute("data-category"));
  }
};

// ── Cart Storage Logic (LocalStorage) ──
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("hatira_cart")) || [];
  } catch (e) {
    return [];
  }
}

function setCart(c) {
  localStorage.setItem("hatira_cart", JSON.stringify(c));
  updateCartUI();
}

function cartContains(src) {
  return getCart().some((x) => x.src === src);
}

function toggleCart(photo) {
  let c = getCart();
  const idx = c.findIndex((x) => x.src === photo.src);
  if (idx > -1) {
    c.splice(idx, 1);
  } else {
    c.push(photo);
  }
  setCart(c);
}

function updateCartUI() {
  const c = getCart();
  const badge = document.getElementById("cartBadge");
  const countEl = document.getElementById("selectedCount");
  if (badge) badge.textContent = c.length;
  if (countEl) countEl.textContent = c.length;

  const list = document.getElementById("cartItemsList");
  if (!list) return;
  list.innerHTML = "";

  if (c.length === 0) {
    list.innerHTML = '<p class="empty-cart-msg">هیچ عکسی انتخاب نشده است.</p>';
    return;
  }

  c.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item-row";
    div.innerHTML = `
      <img src="${item.src}" alt="">
      <span class="cart-item-title">${item.title || "بدون عنوان"}</span>
      <button class="cart-item-remove" data-idx="${index}">✕</button>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll(".cart-item-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const cart = getCart();
      cart.splice(idx, 1);
      setCart(cart);
      const activeTab = document.querySelector(".tab-btn.active");
      if (activeTab) switchCategory(activeTab.getAttribute("data-category"));
    });
  });
}

window.toggleCartModal = function (show) {
  const modal = document.getElementById("cartModal");
  if (!modal) return;
  if (show) {
    updateCartUI();
    modal.classList.add("active");
  } else {
    modal.classList.remove("active");
  }
};

window.clearCart = function () {
  if (getCart().length === 0) return;
  if (!confirm("آیا از حذف تمام عکس‌های انتخاب‌شده مطمئن هستید؟")) return;
  setCart([]);
  const activeTab = document.querySelector(".tab-btn.active");
  if (activeTab) switchCategory(activeTab.getAttribute("data-category"));
};

// ── ثبت سفارش و پیام تلگرام/واتس‌اپ ──
window.submitOrderForm = function (e) {
  e.preventDefault();
  const cart = getCart();
  if (cart.length === 0) {
    alert("سبد خرید شما خالی است!");
    return;
  }

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const notes = document.getElementById("customerNotes").value.trim();

  if (!name || !phone) {
    alert("لطفاً نام و شماره تماس خود را وارد کنید.");
    return;
  }

  let msg = `📸 *سفارش جدید آلبوم خاطرات*\n\n`;
  msg += `👤 *مشتری:* ${name}\n`;
  msg += `📞 *تلفن:* ${phone}\n`;
  if (notes) msg += `📝 *توضیحات:* ${notes}\n`;
  msg += `\n🖼 *عکس‌های انتخاب شده (${cart.length} عدد):*\n`;

  cart.forEach((item, i) => {
    msg += `${i + 1}. ${item.title || "بدون عنوان"}\n🔗 ${item.src}\n\n`;
  });

  const encoded = encodeURIComponent(msg);
  // ارسال به واتس‌اپ پیش‌فرض
  const whatsappUrl = `https://wa.me/905550000000?text=${encoded}`;

  localStorage.removeItem("hatira_cart");
  window.toggleCartModal(false);
  updateCartUI();
  const activeTab = document.querySelector(".tab-btn.active");
  if (activeTab) switchCategory(activeTab.getAttribute("data-category"));

  window.open(whatsappUrl, "_blank");
};

/* ═══════════════════════════════════════════════════════════
   ADMIN PANEL LOGIC (کدهای پنل مدیریت و هماهنگ‌سازی با فایربیس)
   ═══════════════════════════════════════════════════════════ */
(function () {
  const API_BASE = "https://fotoalbum-api.YOUR-SUBDOMAIN.workers.dev/api";
  let _cloudinaryConfig = null;
  let apQueue = [];
  let pwdTargetType = "";

  function cfg(k) {
    if (_cloudinaryConfig && _cloudinaryConfig[k] !== undefined)
      return _cloudinaryConfig[k];
    return "";
  }

  // ورود به سیستم
  window.doSystemLogin = async function () {
    const u = document.getElementById("lgUser").value.trim();
    const p = document.getElementById("lgPass").value;
    const errEl = document.getElementById("lgErr");
    errEl.textContent = "";

    try {
      const res = await fetch(`${API_BASE}/login/system/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        errEl.textContent = data.error || "خطا در ورود به سیستم";
        return;
      }
      document.getElementById("loginSystemBlock").style.display = "none";
      document.getElementById("loginAdminBlock").style.display = "block";
    } catch (e) {
      errEl.textContent = "خطا در ارتباط با سرور";
    }
  };

  // ورود ادمین
  window.doAdminLogin = async function () {
    const u = document.getElementById("lgAdminUser").value.trim();
    const p = document.getElementById("lgAdminPass").value;
    const errEl = document.getElementById("lgAdminErr");
    errEl.textContent = "";

    try {
      const res = await fetch(`${API_BASE}/login/admin/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        errEl.textContent = data.error || "رمز ادمین اشتباه است";
        return;
      }
      await fetchCloudinaryConfig();
      document.getElementById("adminAuthContainer").style.display = "none";
      document.getElementById("adminMainContainer").style.display = "block";
      refreshAllSelectors();
    } catch (e) {
      errEl.textContent = "خطا در تایید رمز ادمین";
    }
  };

  async function fetchCloudinaryConfig() {
    try {
      const res = await fetch(`${API_BASE}/config/cloudinary/`);
      if (res.ok) {
        _cloudinaryConfig = await res.json();
      }
    } catch (e) {
      console.error("Cloudinary Config Error:", e);
    }
  }

  // ══════════ تابع همگام‌سازی مستقیم داده‌ها با فایربیس ══════════
  async function syncDataToFirebase() {
    const statusEl = document.getElementById("statusMessage");
    if (statusEl) statusEl.textContent = "⏳ در حال ذخیره در فایربیس...";

    if (!window.db) {
      apToast("❌ خطا: دیتابیس آنلاین فایربیس متصل نیست.");
      return;
    }

    try {
      // بروزرسانی مستقیم درخت داده‌ها در فایربیس
      await window.db.ref("siteData/DATA").set(window.DATA);
      apToast("✅ تغییرات با موفقیت در فایربیس ذخیره شد");
      if (statusEl) statusEl.textContent = "✅ هماهنگ با سرور فایربیس";
    } catch (error) {
      console.error("Firebase Update Error:", error);
      apToast("❌ خطا در هماهنگ‌سازی اطلاعات آنلاین");
      if (statusEl) statusEl.textContent = "❌ خطای هماهنگ‌سازی";
    }
  }

  // مدیریت انتخابگرهای ادمین
  window.refreshAllSelectors = function () {
    const catSel = document.getElementById("apCategorySelect");
    const viewSel = document.getElementById("apViewCategorySelect");
    if (!catSel || !viewSel) return;

    catSel.innerHTML = "";
    viewSel.innerHTML = "";

    Object.keys(window.DATA).forEach((key) => {
      const lbl = window.DATA[key].label || key;

      const opt1 = document.createElement("option");
      opt1.value = key;
      opt1.textContent = lbl;
      catSel.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = key;
      opt2.textContent = lbl;
      viewSel.appendChild(opt2);
    });

    renderAdminPhotos();
  };

  // رندر کردن گالری در پنل مدیریت ادمین
  window.renderAdminPhotos = function () {
    const grid = document.getElementById("apPhotosGrid");
    const catKey = document.getElementById("apViewCategorySelect")?.value;
    if (!grid) return;
    grid.innerHTML = "";

    if (
      !catKey ||
      !window.DATA[catKey] ||
      !window.DATA[catKey].photos ||
      window.DATA[catKey].photos.length === 0
    ) {
      grid.innerHTML =
        "<p style='grid-column:1/-1; text-align:center; color:var(--text-muted);'>هیچ عکسی در این دسته‌بندی وجود ندارد.</p>";
      return;
    }

    window.DATA[catKey].photos.forEach((photo, idx) => {
      const item = document.createElement("div");
      item.className = "apg-item";
      item.innerHTML = `
        <img src="${photo.src}" alt="">
        <input type="text" class="apg-title" value="${photo.title || ""}" placeholder="بدون عنوان" data-idx="${idx}">
        <button class="apg-del-btn" data-idx="${idx}">✕ حذف</button>
      `;
      grid.appendChild(item);
    });

    // ثبت خودکار تغییر نام تایتل تصویر در فایربیس به محض جابجایی فوکوس
    grid.querySelectorAll(".apg-title").forEach((inp) => {
      inp.addEventListener("change", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        if (window.DATA[catKey] && window.DATA[catKey].photos[idx]) {
          window.DATA[catKey].photos[idx].title = e.target.value.trim();
          syncDataToFirebase();
        }
      });
    });

    grid.querySelectorAll(".apg-del-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        deleteExistingPhoto(catKey, idx);
      });
    });
  };

  // ایجاد دسته‌بندی جدید
  window.addNewCategory = function () {
    const idInp = document.getElementById("newCatId");
    const titleInp = document.getElementById("newCatTitle");
    const id = idInp.value.trim().toLowerCase();
    const title = titleInp.value.trim();

    if (!id || !title) {
      apToast("لطفاً هم شناسه و هم عنوان را وارد کنید.");
      return;
    }
    if (window.DATA[id]) {
      apToast("این شناسه مناسبت از قبل وجود دارد.");
      return;
    }

    window.DATA[id] = {
      label: title,
      photos: [],
    };

    idInp.value = "";
    titleInp.value = "";
    refreshAllSelectors();
    syncDataToFirebase();
  };

  function deleteExistingPhoto(catKey, idx) {
    if (!confirm("آیا از حذف این عکس مطمئن هستید؟")) return;
    window.DATA[catKey].photos.splice(idx, 1);
    renderAdminPhotos();
    syncDataToFirebase();
  }

  // انتخاب فایل‌ها برای صف آپلود
  window.handleApFilesSelect = function (e) {
    const files = Array.from(e.target.files);
    const queueList = document.getElementById("apQueueList");
    if (!queueList) return;

    files.forEach((file) => {
      if (
        apQueue.some(
          (q) => q.file.name === file.name && q.file.size === file.size,
        )
      )
        return;
      const id = "q_" + Math.random().toString(36).substr(2, 9);
      apQueue.push({ id, file, status: "waiting" });

      const li = document.createElement("div");
      li.className = "ap-q-item";
      li.id = id;
      li.innerHTML = `
        <span class="ap-q-name">${file.name}</span>
        <span class="ap-q-status waiting">در انتظار...</span>
      `;
      queueList.appendChild(li);
    });
    e.target.value = "";
  };

  // شروع آپلود تصاویر به کلودینری و ثبت همزمان در فایربیس
  window.startApUploads = async function () {
    const catKey = document.getElementById("apCategorySelect").value;
    if (!catKey) {
      apToast("لطفاً ابتدا یک دسته‌بندی انتخاب کنید.");
      return;
    }

    const itemsToUpload = apQueue.filter((q) => q.status === "waiting");
    if (itemsToUpload.length === 0) {
      apToast("هیچ فایلی برای آپلود در صف نیست.");
      return;
    }

    for (let item of itemsToUpload) {
      const row = document.getElementById(item.id);
      const statusText = row.querySelector(".ap-q-status");
      statusText.className = "ap-q-status uploading";
      statusText.textContent = "در حال آپلود...";
      item.status = "uploading";

      try {
        const url = await uploadFileToCloudinary(item.file);

        if (!window.DATA[catKey].photos) {
          window.DATA[catKey].photos = [];
        }

        window.DATA[catKey].photos.push({
          src: url,
          title: item.file.name.split(".")[0],
        });

        statusText.className = "ap-q-status success";
        statusText.textContent = "موفقیت‌آمیز";
        item.status = "success";
      } catch (err) {
        statusText.className = "ap-q-status error";
        statusText.textContent = "خطا!";
        item.status = "failed";
      }
    }

    apQueue = apQueue.filter((q) => q.status !== "success");
    setTimeout(() => {
      const queueList = document.getElementById("apQueueList");
      if (queueList) queueList.innerHTML = "";
    }, 3000);

    refreshAllSelectors();
    syncDataToFirebase();
  };

  async function uploadFileToCloudinary(file) {
    const cloudName = cfg("cloudName");
    const preset = cfg("preset");
    if (!cloudName || !preset)
      throw new Error("تنظیمات کلودینری لود نشده است.");

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);

    const res = await fetch(url, { method: "POST", body: fd });
    if (!res.ok) throw new Error("خطای آپلود کلودینری");
    const data = await res.json();
    return data.secure_url;
  }

  window.apToast = function (msg) {
    const t = document.getElementById("apToast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
  };

  window.openAdmin = function () {
    const overlay = document.getElementById("adminOverlay");
    if (overlay) overlay.style.display = "block";
  };

  window.closeAdmin = function () {
    const overlay = document.getElementById("adminOverlay");
    if (overlay) overlay.style.display = "none";
  };

  const adminOverlay = document.getElementById("adminOverlay");
  if (adminOverlay) {
    adminOverlay.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeAdmin();
    });
  }
})();

// تغییر تب‌ها در بخش پنل مدیریت ادمین
window.switchAdminTab = function (tabName) {
  const uploadsContent = document.getElementById("tab-uploads");
  const settingsContent = document.getElementById("tab-settings");
  const btnUploads = document.getElementById("btnTabUploads");
  const btnSettings = document.getElementById("btnTabSettings");

  if (tabName === "uploads") {
    uploadsContent.style.display = "block";
    settingsContent.style.display = "none";

    btnUploads.classList.add("active");
    btnUploads.style.borderBottomColor = "var(--gold)";
    btnUploads.style.color = "var(--brown-dark)";
    btnUploads.style.fontWeight = "600";

    btnSettings.classList.remove("active");
    btnSettings.style.borderBottomColor = "transparent";
    btnSettings.style.color = "var(--text-muted)";
    btnSettings.style.fontWeight = "500";
  } else {
    uploadsContent.style.display = "none";
    settingsContent.style.display = "block";

    btnSettings.classList.add("active");
    btnSettings.style.borderBottomColor = "var(--gold)";
    btnSettings.style.color = "var(--brown-dark)";
    btnSettings.style.fontWeight = "600";

    btnUploads.classList.remove("active");
    btnUploads.style.borderBottomColor = "transparent";
    btnUploads.style.color = "var(--text-muted)";
    btnUploads.style.fontWeight = "500";
  }
};
