const dataForm = document.getElementById("dataForm");
const tableBody = document.getElementById("table-body");
const showFormBtn = document.getElementById("showFormBtn");
const resetBtn = document.getElementById("rst");
const formModal = document.getElementById("formModal");
let rowToDelete = null;
let employees = [];
let currentPage = 1;
let defValue = 3;
let rowsPerPage;
let editingIndex = null;

const rows = [3, 5, 10, "All"];
let rowsPerPageDropdown;
let showAllRows = false;

function createRowsPerPage(options, defaultvalue) {
  const select = document.createElement("select");
  select.id = "rowsPerPage";
  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    if (value === defaultvalue) option.selected = true;
    select.appendChild(option);
  });
  select.classList.add("pagination-dropdown");
  return select;
}

function setupRowsPerPageDropdown() {
  // Create a container for the rows selector
  const rowsSelectorContainer = document.createElement("div");
  rowsSelectorContainer.className = "rows-per-page-container";
  rowsSelectorContainer.innerHTML =
    '<label for="rowsPerPage">Rows per page:</label>';

  // Create the dropdown
  rowsPerPageDropdown = createRowsPerPage(rows, rowsPerPage || defValue);
  rowsPerPageDropdown.addEventListener("change", function () {
    if (this.value === "All") {
      showAllRows = true;
      rowsPerPage = employees.length;
    } else {
      showAllRows = false;
      rowsPerPage = parseInt(this.value, 10);
    }
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  // Add the dropdown to the container
  rowsSelectorContainer.appendChild(rowsPerPageDropdown);

  // Insert the container after the table but before pagination
  const table = document.querySelector("table");
  table.parentNode.insertBefore(rowsSelectorContainer, table.nextSibling);
}

// Modal utility
function showModal({ title, messages, buttonText, onButtonClick }) {
  const modal = document.getElementById("myModal");
  modal.style.display = "block";
  modal.querySelector("h2").textContent = title;
  modal.querySelector("p").innerHTML = Array.isArray(messages)
    ? messages.map((msg) => `• ${msg}`).join("<br>")
    : messages;
  const modalBtn = modal.querySelector(".modal-content button");
  modalBtn.textContent = buttonText;
  modalBtn.onclick = function () {
    modal.style.display = "none";
    if (onButtonClick) onButtonClick();
  };
}

// Form Modal control functions
function openFormModal() {
  formModal.style.display = "block";
  if (editingIndex == null) dataForm.reset();
}
function closeFormModal() {
  formModal.style.display = "none";
  editingIndex = null;
}

// Delete row with confirmation
function deleteRow(deleteButton) {
  const row = deleteButton.closest("tr");
  if (row) {
    const index = parseInt(row.getAttribute("data-index"));
    rowToDelete = index;
    closeFormModal();
    showModal({
      title: "Warning",
      messages: "Do you really want to delete the entry?",
      buttonText: "Delete",
      onButtonClick: function () {
        if (rowToDelete !== null) {
          employees.splice(rowToDelete, 1);
          if (showAllRows) {
            rowsPerPage = employees.length;
          } else if (employees.length % rowsPerPage === 0 && currentPage > 1) {
            currentPage--;
          }
          renderTable();
          renderPagination();
        }
        rowToDelete = null;
      },
    });
  }
}

// Modal close handlers
document.querySelectorAll(".close-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    const modal = this.closest(".modal");
    modal.style.display = "none";
    rowToDelete = null;
    if (modal.id === "formModal") {
      editingIndex = null;
      dataForm.reset();
    }
  });
});
window.onclick = function (event) {
  const modal = document.getElementById("myModal");
  const formModal = document.getElementById("formModal");
  if (event.target === modal) {
    modal.style.display = "none";
    rowToDelete = null;
  }
  if (event.target === formModal) {
    formModal.style.display = "none";
    editingIndex = null;
  }
};

// Edit row
function editRow(editButton) {
  const row = editButton.closest("tr");
  const index = parseInt(row.getAttribute("data-index"));
  const emp = employees[index];
  document.getElementById("EmpID").value = emp.empID;
  document.getElementById("Name").value = emp.name;
  document.getElementById("DOB").value = emp.dob;
  document.getElementById("Age").value = emp.age;
  document.getElementById("course").value = emp.course;
  document.getElementById("Sal").value = emp.salary;
  editingIndex = index;
  openFormModal();
}

// Age calculation
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

// Format date for British locale
function formatDateBritish(dateStr) {
  if (!dateStr) return "";
  const dateObj = new Date(dateStr);
  return dateObj.toLocaleDateString("en-GB");
}

// Form submit handler
function formSubmit(event) {
  event.preventDefault();
  const errmsg = [];
  const eEmpID = document.getElementById("EmpID").value.trim();
  const eName = document.getElementById("Name").value.trim();
  const eDOB = document.getElementById("DOB").value;
  const ecourse = document.getElementById("course").value;
  const eSal = document.getElementById("Sal").value.trim();

  // Validation
  if (!eEmpID) errmsg.push("Emp ID");
  if (!eName) errmsg.push("Name");
  let eAge = "";
  if (!eDOB) {
    errmsg.push("DOB");
  } else {
    eAge = calculateAge(eDOB);
    if (eAge < 18) errmsg.push("Minimum age is 18");
    document.getElementById("Age").value = eAge;
  }
  if (!ecourse) errmsg.push("Course Name");
  if (!eSal) errmsg.push("Salary");

  if (errmsg.length > 0) {
    closeFormModal();
    showModal({
      title: "Validation Error",
      messages: errmsg,
      buttonText: "Close",
    });
    return;
  }

  // Duplicate checks
  let isDuplicateEmpID = false;
  let isRedundantNameDOB = false;
  employees.forEach((emp, index) => {
    if (editingIndex !== null && index === editingIndex) return;
    if (emp.empID === eEmpID) isDuplicateEmpID = true;
    if (emp.name === eName && emp.dob === eDOB) isRedundantNameDOB = true;
  });
  if (isDuplicateEmpID) {
    closeFormModal();
    showModal({
      title: "Duplicate EmpID",
      messages: ["This EmpID already exists in the table."],
      buttonText: "Close",
    });
    return;
  }
  if (isRedundantNameDOB) {
    closeFormModal();
    showModal({
      title: "Redundant Entry",
      messages: ["An entry with the same Name and DOB already exists."],
      buttonText: "Close",
    });
    return;
  }

  if (editingIndex !== null) {
    employees[editingIndex] = {
      empID: eEmpID,
      name: eName,
      dob: eDOB,
      age: eAge,
      course: ecourse,
      salary: eSal,
    };
    editingIndex = null;
  } else {
    employees.push({
      empID: eEmpID,
      name: eName,
      dob: eDOB,
      age: eAge,
      course: ecourse,
      salary: eSal,
    });
  }
  if (showAllRows) {
    rowsPerPage = employees.length;
  }
  closeFormModal();
  renderTable();
  renderPagination();
}

// Render table for current page
function renderTable() {
  let start, end, pageData;
  if (showAllRows) {
    start = 0;
    end = employees.length;
    pageData = employees.slice(start, end);
  } else {
    start = (currentPage - 1) * rowsPerPage;
    end = start + rowsPerPage;
    pageData = employees.slice(start, end);
  }
  tableBody.innerHTML = "";
  pageData.forEach((emp, index) => {
    const row = document.createElement("tr");
    row.setAttribute("data-index", start + index);
    [
      emp.empID,
      emp.name,
      formatDateBritish(emp.dob),
      emp.age,
      emp.course,
      emp.salary,
    ].forEach((val) => {
      const cell = document.createElement("td");
      cell.textContent = val;
      row.appendChild(cell);
    });
    const actionCell = document.createElement("td");
    actionCell.className = "action-buttons";
    actionCell.innerHTML = `<button class="edit-btn">Edit</button><button class="delete-btn">Delete</button>`;
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

function renderPagination() {
  const totalPages = showAllRows ? 1 : Math.ceil(employees.length / rowsPerPage);
  const pagination = document.getElementById("pagination-controls");

  // Clear all buttons
  pagination.innerHTML = "";

  // Only show pagination buttons if more than 1 page
  if (totalPages > 1 && !showAllRows) {
    // Previous button
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
      currentPage--;
      renderTable();
      renderPagination();
    };
    pagination.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.classList.toggle("active", i === currentPage);
      btn.onclick = () => {
        currentPage = i;
        renderTable();
        renderPagination();
      };
      pagination.appendChild(btn);
    }

    // Next button
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
      currentPage++;
      renderTable();
      renderPagination();
    };
    pagination.appendChild(nextBtn);
  }
}

// Table row action handler
tableBody.addEventListener("click", function (e) {
  const clickedElement = e.target;
  if (clickedElement.classList.contains("edit-btn")) {
    editRow(clickedElement);
  } else if (clickedElement.classList.contains("delete-btn")) {
    deleteRow(clickedElement);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Initialize showAllRows flag
  // showAllRows = false;

  rowsPerPage = defValue;
  renderTable();
  setupRowsPerPageDropdown();
  renderPagination();
});

// Form submit event
dataForm.addEventListener("submit", formSubmit);

// Reset button handler
resetBtn.addEventListener("click", function () {
  dataForm.reset();
  editingIndex = null;
});

// Show form button handler
showFormBtn.addEventListener("click", openFormModal);
