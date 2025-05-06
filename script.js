// Sample data for SKPD
let skpdData = [
  {
    id: 1,
    nomor: "SKPD/2025/001",
    tanggal: "2025-05-01",
    platNomor: "B 1234 ABC",
    pemilik: "Ahmad Rizky",
    jenisKendaraan: "Mobil Penumpang",
    jumlahPajak: 1500000,
    status: "Lunas",
    keterangan: "Pembayaran tahunan",
  },
  {
    id: 2,
    nomor: "SKPD/2025/002",
    tanggal: "2025-05-02",
    platNomor: "B 5678 DEF",
    pemilik: "Budi Santoso",
    jenisKendaraan: "Sepeda Motor",
    jumlahPajak: 500000,
    status: "Belum Lunas",
    keterangan: "Jatuh tempo 15 Mei 2025",
  },
  {
    id: 3,
    nomor: "SKPD/2025/003",
    tanggal: "2025-04-25",
    platNomor: "B 9012 GHI",
    pemilik: "Citra Dewi",
    jenisKendaraan: "Mobil Angkutan",
    jumlahPajak: 2000000,
    status: "Lunas",
    keterangan: "",
  },
  {
    id: 4,
    nomor: "SKPD/2025/004",
    tanggal: "2025-04-18",
    platNomor: "B 3456 JKL",
    pemilik: "David Wijaya",
    jenisKendaraan: "Mobil Barang",
    jumlahPajak: 2500000,
    status: "Belum Lunas",
    keterangan: "Jatuh tempo 18 Mei 2025",
  },
  {
    id: 5,
    nomor: "SKPD/2024/120",
    tanggal: "2024-12-15",
    platNomor: "B 7890 MNO",
    pemilik: "Eka Pratama",
    jenisKendaraan: "Sepeda Motor",
    jumlahPajak: 450000,
    status: "Lunas",
    keterangan: "Pembayaran tahunan",
  },
];

// Variables for table sorting and pagination
let currentSort = { field: "tanggal", order: "desc" };
let currentPage = 1;
const rowsPerPage = 10;
let filteredData = [...skpdData];

// DOM elements
const skpdTableBody = document.getElementById("skpd-table-body");
const emptyState = document.getElementById("empty-state");
const pagination = document.getElementById("pagination");
const modal = document.getElementById("skpd-modal");
const modalTitle = document.getElementById("modal-title");
const skpdForm = document.getElementById("skpd-form");
const editIdInput = document.getElementById("edit-id");
const addSkpdBtn = document.getElementById("add-skpd-btn");
const addFirstSkpdBtn = document.getElementById("add-first-skpd");
const closeModalBtns = document.querySelectorAll(".close-btn, .close-modal");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const filterMonth = document.getElementById("filter-month");
const filterYear = document.getElementById("filter-year");
const filterStatus = document.getElementById("filter-status");
const currentDateElement = document.getElementById("current-date");
const sortableHeaders = document.querySelectorAll("th[data-sort]");

// Initialize local storage
const initLocalStorage = () => {
  if (!localStorage.getItem("skpdData")) {
    localStorage.setItem("skpdData", JSON.stringify(skpdData));
  } else {
    try {
      skpdData = JSON.parse(localStorage.getItem("skpdData"));
    } catch (e) {
      console.error("Error parsing skpdData from localStorage:", e);
      localStorage.setItem("skpdData", JSON.stringify(skpdData));
    }
  }
};

// Save data to local storage
const saveToLocalStorage = () => {
  try {
    localStorage.setItem("skpdData", JSON.stringify(skpdData));
  } catch (e) {
    console.error("Error saving to localStorage:", e);
    alert("Terjadi kesalahan saat menyimpan data. Mohon coba lagi.");
  }
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(amount);
};

// Format date for display
const formatDate = (dateString) => {
  const options = { day: "numeric", month: "long", year: "numeric" };
  return new Date(dateString).toLocaleDateString("id-ID", options);
};

// Generate SKPD number
const generateSkpdNumber = () => {
  const today = new Date();
  const year = today.getFullYear();

  // Find the highest number for current year
  const yearPrefix = `SKPD/${year}/`;
  let maxNum = 0;

  skpdData.forEach((item) => {
    if (item.nomor && item.nomor.startsWith(yearPrefix)) {
      const numStr = item.nomor.substring(yearPrefix.length);
      const num = parseInt(numStr);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  // Generate next number with leading zeros
  const nextNum = maxNum + 1;
  const paddedNum = nextNum.toString().padStart(3, "0");

  return `${yearPrefix}${paddedNum}`;
};

// Get all years from data for filter
const populateYearFilter = () => {
  const years = [
    ...new Set(
      skpdData.map((item) => {
        try {
          return new Date(item.tanggal).getFullYear();
        } catch (e) {
          console.error("Error parsing date:", item.tanggal);
          return new Date().getFullYear();
        }
      })
    ),
  ];

  years.sort((a, b) => b - a); // Sort years in descending order

  const yearSelect = document.getElementById("filter-year");
  yearSelect.innerHTML = '<option value="">Semua Tahun</option>';

  years.forEach((year) => {
    if (!isNaN(year)) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
  });
};

// Display current date
const showCurrentDate = () => {
  const now = new Date();
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  currentDateElement.textContent = now.toLocaleDateString("id-ID", options);
};

// Filter and sort data
const filterAndSortData = () => {
  const searchTerm = (searchInput.value || "").toLowerCase();
  const monthFilter = filterMonth.value;
  const yearFilter = filterYear.value;
  const statusFilter = filterStatus.value;

  filteredData = skpdData.filter((item) => {
    if (!item.nomor || !item.platNomor || !item.pemilik || !item.tanggal) {
      return false;
    }

    const matchesSearch =
      item.nomor.toLowerCase().includes(searchTerm) ||
      item.platNomor.toLowerCase().includes(searchTerm) ||
      item.pemilik.toLowerCase().includes(searchTerm);

    let itemDate;
    try {
      itemDate = new Date(item.tanggal);
    } catch (e) {
      console.error("Invalid date:", item.tanggal);
      return false;
    }

    if (isNaN(itemDate.getTime())) {
      return false;
    }

    const matchesMonth =
      monthFilter === "" || itemDate.getMonth() === parseInt(monthFilter);
    const matchesYear =
      yearFilter === "" || itemDate.getFullYear() === parseInt(yearFilter);
    const matchesStatus = statusFilter === "" || item.status === statusFilter;

    return matchesSearch && matchesMonth && matchesYear && matchesStatus;
  });

  // Sort data
  filteredData.sort((a, b) => {
    let valueA, valueB;

    if (currentSort.field === "tanggal") {
      valueA = new Date(a[currentSort.field]);
      valueB = new Date(b[currentSort.field]);

      // Handle invalid dates
      if (isNaN(valueA.getTime())) valueA = new Date(0);
      if (isNaN(valueB.getTime())) valueB = new Date(0);
    } else if (currentSort.field === "jumlahPajak") {
      valueA = parseFloat(a[currentSort.field]) || 0;
      valueB = parseFloat(b[currentSort.field]) || 0;
    } else {
      valueA = a[currentSort.field] || "";
      valueB = b[currentSort.field] || "";
      if (typeof valueA === "string") {
        valueA = valueA.toLowerCase();
      }
      if (typeof valueB === "string") {
        valueB = valueB.toLowerCase();
      }
    }

    if (valueA < valueB) {
      return currentSort.order === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return currentSort.order === "asc" ? 1 : -1;
    }
    return 0;
  });

  currentPage = 1;
  renderTable();
  renderPagination();
};

// Render table with data
const renderTable = () => {
  if (filteredData.length === 0) {
    skpdTableBody.innerHTML = "";
    emptyState.style.display = "block";
    pagination.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  pagination.style.display = "flex";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = filteredData.slice(start, end);

  skpdTableBody.innerHTML = "";

  paginatedData.forEach((item) => {
    const row = document.createElement("tr");

    // Format date safely
    let formattedDate = "Invalid Date";
    try {
      const dateObj = new Date(item.tanggal);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = formatDate(item.tanggal);
      }
    } catch (e) {
      console.error("Error formatting date:", item.tanggal);
    }

    row.innerHTML = `
            <td>${item.nomor || "-"}</td>
            <td>${formattedDate}</td>
            <td>${item.platNomor || "-"}</td>
            <td>${item.pemilik || "-"}</td>
            <td>${item.jenisKendaraan || "-"}</td>
            <td>${formatCurrency(item.jumlahPajak || 0)}</td>
            <td>
                <span class="status-badge ${
                  item.status === "Lunas"
                    ? "status-lunas"
                    : "status-belum-lunas"
                }">
                    ${item.status || "Belum Lunas"}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${item.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>
                    <button class="action-btn delete-btn" data-id="${item.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                        Hapus
                    </button>
                </div>
            </td>
        `;

    // Add tooltip for keterangan if exists
    if (item.keterangan) {
      const tooltipCell = document.createElement("div");
      tooltipCell.className = "tooltip";
      tooltipCell.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="8"></line>
                </svg>
                <span class="tooltiptext">${item.keterangan}</span>
            `;
      row
        .querySelector("td:last-child .action-buttons")
        .appendChild(tooltipCell);
    }

    skpdTableBody.appendChild(row);
  });
};

// Render pagination controls
const renderPagination = () => {
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  pagination.innerHTML = "";

  if (totalPages <= 1) {
    return;
  }

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.innerHTML = "&laquo;";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      renderPagination();
    }
  });
  pagination.appendChild(prevButton);

  // Page buttons
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.toggle("active", i === currentPage);
    pageButton.addEventListener("click", () => {
      currentPage = i;
      renderTable();
      renderPagination();
    });
    pagination.appendChild(pageButton);
  }

  // Next button
  const nextButton = document.createElement("button");
  nextButton.innerHTML = "&raquo;";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      renderPagination();
    }
  });
  pagination.appendChild(nextButton);
};

// Open modal for adding new SKPD
const openAddModal = () => {
  modalTitle.textContent = "Tambah SKPD Baru";
  editIdInput.value = "";
  skpdForm.reset();

  // Set default date to today
  document.getElementById("tanggal-skpd").valueAsDate = new Date();

  // Auto-generate SKPD number
  document.getElementById("nomor-skpd").value = generateSkpdNumber();

  modal.style.display = "flex";
};

// Open modal for editing SKPD
const openEditModal = (id) => {
  const skpd = skpdData.find((item) => item.id === parseInt(id));
  if (!skpd) return;

  modalTitle.textContent = "Edit SKPD";
  editIdInput.value = skpd.id;

  document.getElementById("nomor-skpd").value = skpd.nomor || "";
  document.getElementById("tanggal-skpd").value = skpd.tanggal || "";
  document.getElementById("plat-nomor").value = skpd.platNomor || "";
  document.getElementById("nama-pemilik").value = skpd.pemilik || "";
  document.getElementById("jenis-kendaraan").value = skpd.jenisKendaraan || "";
  document.getElementById("jumlah-pajak").value = skpd.jumlahPajak || 0;
  document.getElementById("status-pembayaran").value =
    skpd.status || "Belum Lunas";
  document.getElementById("keterangan").value = skpd.keterangan || "";

  modal.style.display = "flex";
};

// Close modal
const closeModal = () => {
  modal.style.display = "none";
};

// Delete SKPD
const deleteSkpd = (id) => {
  if (confirm("Apakah Anda yakin ingin menghapus SKPD ini?")) {
    skpdData = skpdData.filter((item) => item.id !== parseInt(id));
    saveToLocalStorage();
    filterAndSortData();
    populateYearFilter();
  }
};

// Save SKPD form
const saveSkpdForm = (e) => {
  e.preventDefault();

  const id = editIdInput.value ? parseInt(editIdInput.value) : Date.now();
  const skpd = {
    id: id,
    nomor: document.getElementById("nomor-skpd").value,
    tanggal: document.getElementById("tanggal-skpd").value,
    platNomor: document.getElementById("plat-nomor").value,
    pemilik: document.getElementById("nama-pemilik").value,
    jenisKendaraan: document.getElementById("jenis-kendaraan").value,
    jumlahPajak: parseFloat(document.getElementById("jumlah-pajak").value) || 0,
    status: document.getElementById("status-pembayaran").value,
    keterangan: document.getElementById("keterangan").value,
  };

  if (editIdInput.value) {
    // Edit existing SKPD
    const index = skpdData.findIndex((item) => item.id === parseInt(id));
    if (index !== -1) {
      skpdData[index] = skpd;
    }
  } else {
    // Add new SKPD
    skpdData.push(skpd);
  }

  saveToLocalStorage();
  closeModal();
  filterAndSortData();
  populateYearFilter();
};

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Initialize data
    initLocalStorage();
    showCurrentDate();
    populateYearFilter();
    filterAndSortData();

    // Add SKPD buttons
    addSkpdBtn.addEventListener("click", openAddModal);
    addFirstSkpdBtn.addEventListener("click", openAddModal);

    // Close modal buttons
    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    // Submit form
    skpdForm.addEventListener("submit", saveSkpdForm);

    // Search and filter
    searchBtn.addEventListener("click", filterAndSortData);
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        filterAndSortData();
      }
    });

    filterMonth.addEventListener("change", filterAndSortData);
    filterYear.addEventListener("change", filterAndSortData);
    filterStatus.addEventListener("change", filterAndSortData);

    // Table sorting
    sortableHeaders.forEach((header) => {
      header.addEventListener("click", () => {
        const field = header.getAttribute("data-sort");

        // Clear active sort indicators
        sortableHeaders.forEach((h) => {
          h.classList.remove("active");
          h.removeAttribute("data-order");
        });

        if (currentSort.field === field) {
          // Toggle order if same field
          currentSort.order = currentSort.order === "asc" ? "desc" : "asc";
        } else {
          // New field, default to asc
          currentSort.field = field;
          currentSort.order = "asc";
        }

        // Set active sort indicator
        header.classList.add("active");
        header.setAttribute(
          "data-order",
          currentSort.order === "asc" ? "↑" : "↓"
        );

        filterAndSortData();
      });
    });

    // Set default sort indicator
    const defaultSortHeader = document.querySelector(
      `th[data-sort="${currentSort.field}"]`
    );
    if (defaultSortHeader) {
      defaultSortHeader.classList.add("active");
      defaultSortHeader.setAttribute(
        "data-order",
        currentSort.order === "asc" ? "↑" : "↓"
      );
    }

    // Table row actions
    skpdTableBody.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".edit-btn");
      const deleteBtn = e.target.closest(".delete-btn");

      if (editBtn) {
        const id = editBtn.getAttribute("data-id");
        openEditModal(id);
      } else if (deleteBtn) {
        const id = deleteBtn.getAttribute("data-id");
        deleteSkpd(id);
      }
    });

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Handle Escape key for modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display === "flex") {
        closeModal();
      }
    });
  } catch (error) {
    console.error("Error during initialization:", error);
    alert(
      "Terjadi kesalahan saat memuat aplikasi. Silakan muat ulang halaman."
    );
  }
});
