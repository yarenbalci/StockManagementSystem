document.addEventListener("DOMContentLoaded", function () {
    const userRole = localStorage.getItem("role") || "";
    const cleanRole = userRole.trim().toLowerCase();
    const isAdmin = (cleanRole === "admin" || cleanRole === "administrator");

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const username = localStorage.getItem("username") || "User";

    // 2. Element seçimlendirmeleri
    const loginBtn = document.getElementById("loginBtn");
    const userDropdownContainer = document.getElementById("userDropdownContainer");
    const navUsername = document.getElementById("navUsername");
    const navRole = document.getElementById("navRole");
    const userAvatarLetter = document.getElementById("userAvatarLetter");
    const logoutBtn = document.getElementById("logoutBtn");
    const addNewProductBtn = document.getElementById("addNewProductBtn") || document.querySelector('[data-bs-target="#addProductModal"]');

    // 3. Oturum ve Arayüz Yetki Yönetimi
    if (isLoggedIn === "true") {
        if (loginBtn) loginBtn.style.display = "none";
        if (userDropdownContainer) userDropdownContainer.style.display = "block";

        if (navUsername) navUsername.textContent = username;
        if (navRole) navRole.textContent = userRole;
        if (userAvatarLetter) userAvatarLetter.textContent = username.charAt(0).toUpperCase();


        if (addNewProductBtn) {
            if (isAdmin) {
                addNewProductBtn.classList.remove("d-none");
            } else {
                addNewProductBtn.classList.add("d-none");
            }
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
                e.preventDefault();
                localStorage.clear();
                window.location.href = 'login.html';
            });
        }
    } else {
        if (loginBtn) loginBtn.style.display = "block";
        if (userDropdownContainer) userDropdownContainer.style.display = "none";
        if (addNewProductBtn) addNewProductBtn.classList.add("d-none");
    }

    // 4. Sayfa Verilerini ve Event Listener'ları Yükle
    loadCategoriesForFilter();
    loadDashboardData();

    const addProductForm = document.getElementById("addProductForm");
    if (addProductForm) {
        addProductForm.addEventListener("submit", handleProductSubmit);
    }

    if (addNewProductBtn) {
        addNewProductBtn.addEventListener("click", function () {
            resetModalToCreateMode();
        });
    }

    const addProductModal = document.getElementById('addProductModal');
    if (addProductModal) {
        addProductModal.addEventListener('hidden.bs.modal', function () {
            resetModalToCreateMode();
        });
    }

    const btnRefresh = document.getElementById("btnRefresh");
    if (btnRefresh) {
        btnRefresh.addEventListener("click", function () {
            if (typeof resetFilters === 'function') {
                resetFilters();
            } else {
                location.reload();
            }
        });
    }

    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.querySelector(".sidebar") || document.getElementById("sidebar");

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener("click", function () {
            sidebar.classList.toggle("d-none");
        });
    }
});


async function loadCategoriesForFilter() {
    const container = document.getElementById("categoryCheckboxContainer") || document.getElementById("categoriesContainer");
    const modalDropdown = document.getElementById("productCategory");

    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
        const categories = await response.json();

        if (!categories || categories.length === 0) {
            if (container) container.innerHTML = '<small class="text-muted">No categories found.</small>';
            if (modalDropdown) modalDropdown.innerHTML = '<option value="" selected disabled>No categories available</option>';
            return;
        }
        renderCategoriesData(categories);
    } catch (error) {
        console.error("Error loading categories:", error);
        const mockCategories = [
            { categoryId: 1, categoryName: "Beverages" },
            { categoryId: 2, categoryName: "Condiments" },
            { categoryId: 3, categoryName: "Confections" },
            { categoryId: 4, categoryName: "Dairy Products" },
            { categoryId: 5, categoryName: "Grains/Cereals" }
        ];
        renderCategoriesData(mockCategories, true);
    }
}

function renderCategoriesData(categories, isAppend = false) {
    const container = document.getElementById("categoryCheckboxContainer") || document.getElementById("categoriesContainer");
    const modalDropdown = document.getElementById("productCategory");

    let containerHtml = "";
    let dropdownHtml = '<option value="" selected disabled>Select a category...</option>';

    categories.forEach(cat => {
        const catId = cat.categoryId || cat.CategoryID || cat.id;
        const catName = cat.categoryName || cat.CategoryName || cat.name;

        containerHtml += `
            <div class="form-check mb-2 d-flex align-items-center">
                <input class="form-check-input category-filter mt-0 me-2" type="checkbox" value="${catId}" id="cat_${catId}">
                <label class="form-check-label text-start" for="cat_${catId}">
                    ${catName}
                </label>
            </div>
        `;
        dropdownHtml += `<option value="${catId}">${catName}</option>`;
    });

    if (container) {
        container.innerHTML = isAppend ? container.innerHTML + containerHtml : containerHtml;
    }
    if (modalDropdown) {
        modalDropdown.innerHTML = dropdownHtml;
    }
}

function applyFilters() {
    const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked'))
        .map(cb => cb.value);

    const minPriceInput = document.getElementById("filterMinPrice") || document.getElementById("minPriceInput");
    const maxPriceInput = document.getElementById("filterMaxPrice") || document.getElementById("maxPriceInput");

    const minPrice = minPriceInput ? minPriceInput.value : "";
    const maxPrice = maxPriceInput ? maxPriceInput.value : "";

    const selectedStockStatus = Array.from(document.querySelectorAll('.stock-filter:checked'))
        .map(cb => cb.value);

    fetchFilteredProducts({
        categories: selectedCategories.join(','),
        minPrice: minPrice,
        maxPrice: maxPrice,
        stockStatus: selectedStockStatus.join(',')
    });
}



async function loadDashboardData() {
    await fetchFilteredProducts({});
}


async function fetchFilteredProducts(filters) {
    const tableBody = document.getElementById("productTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                Fetching filtered inventory...
            </td>
        </tr>`;

    try {
        const cleanFilters = {};
        for (const key in filters) {
            if (filters[key] !== "" && filters[key] !== null && filters[key] !== undefined) {
                cleanFilters[key] = filters[key];
            }
        }

        const queryParams = new URLSearchParams(cleanFilters);
        const response = await fetch(`/api/products?${queryParams.toString()}`);
        if (!response.ok) throw new Error(`API response error (${response.status})`);

        const products = await response.json();

        // **GRAFİKLER İÇİN EKLEME:** Ürünler gelir gelmez grafikleri güncelliyoruz
        // Kategorileri de API'den veya mevcut elementlerden alarak grafik fonksiyonuna gönderiyoruz
        fetchCategoriesAndRenderCharts(products);

        if (!products || products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        No products match your selected filters.
                    </td>
                </tr>`;
            updateSummaryCards(0, 0, 0, 0);
            return;
        }

        let totalValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let tableRowsHtml = "";

        products.forEach(product => {
            const pId = product.productId || product.ProductID || product.id;
            const pName = product.productName || product.ProductName || product.name;
            const pPrice = product.unitPrice || product.UnitPrice || product.price || 0;
            const pStock = product.unitsInStock !== undefined ? product.unitsInStock : (product.UnitsInStock !== undefined ? product.UnitsInStock : (product.stock || 0));
            const pCategory = product.categoryName || product.CategoryName || (product.category ? product.category.categoryName : 'General');

            totalValue += (pPrice * pStock);

            if (pStock === 0) outOfStockCount++;
            else if (pStock < 10) lowStockCount++;

            let stockBadgeClass = 'bg-success bg-opacity-10 text-success';
            if (pStock === 0) stockBadgeClass = 'bg-danger bg-opacity-10 text-danger';
            else if (pStock < 10) stockBadgeClass = 'bg-warning bg-opacity-10 text-warning';

            tableRowsHtml += `
                <tr>
                    <td class="fw-semibold text-muted ps-3">#${pId}</td>
                    <td><div class="fw-bold text-dark text-truncate" style="max-width: 180px;">${pName}</div></td>
                    <td>$${Number(pPrice).toFixed(2)}</td>
                    <td>
                        <span class="badge ${stockBadgeClass} px-2 py-1">
                            ${pStock} Units
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1">
                            ${pCategory}
                        </span>
                    </td>
                    <td class="text-end pe-3">
                        <button class="btn btn-sm btn-light text-primary border-0 p-1 me-1" onclick="editProduct(${pId})" title="Edit">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-sm btn-light text-danger border-0 p-1" onclick="deleteProduct(${pId})" title="Delete">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </td>
                </tr>`;
        });

        tableBody.innerHTML = tableRowsHtml;
        updateSummaryCards(products.length, totalValue, lowStockCount, outOfStockCount);

    } catch (error) {
        console.error("Error fetching data:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-danger">
                    An error occurred while fetching data from the backend.
                </td>
            </tr>`;
    }
}

function resetFilters() {
    document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
    document.querySelectorAll('.stock-filter').forEach(cb => cb.checked = false);

    const minPriceInput = document.getElementById("filterMinPrice") || document.getElementById("minPriceInput");
    const maxPriceInput = document.getElementById("filterMaxPrice") || document.getElementById("maxPriceInput");

    if (minPriceInput) minPriceInput.value = "";
    if (maxPriceInput) maxPriceInput.value = "";

    fetchFilteredProducts({});
    updateSummaryCards(0, 0, 0, 0);
}


function updateSummaryCards(totalProducts, totalValue, lowStock, outOfStock) {
    const elTotal = document.getElementById("statTotalProducts");
    const elValue = document.getElementById("statTotalValue");
    const elLow = document.getElementById("statLowStock");
    const elOut = document.getElementById("statOutOfStock");

    if (elTotal) elTotal.innerText = totalProducts;
    if (elValue) elValue.innerText = "$" + totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (elLow) elLow.innerText = lowStock;
    if (elOut) elOut.innerText = outOfStock;
}


let categoryBarInstance = null;
let stockDoughnutInstance = null;

async function fetchCategoriesAndRenderCharts(productsData) {
    try {
        const response = await fetch('/api/categories');
        const categoriesData = response.ok ? await response.json() : [];
        renderDashboardCharts(productsData, categoriesData);
    } catch (e) {
        renderDashboardCharts(productsData, []);
    }
}

function renderDashboardCharts(productsData, categoriesData) {
    const categoryCounts = {};

    // Eğer kategori listesi geldiyse isimlerini baz alalım
    categoriesData.forEach(cat => {
        const name = cat.categoryName || cat.CategoryName || cat.name;
        categoryCounts[name] = 0;
    });

    productsData.forEach(prod => {
        const catName = prod.categoryName || prod.CategoryName || (prod.category ? prod.category.categoryName : 'General');
        if (categoryCounts[catName] === undefined) {
            categoryCounts[catName] = 0;
        }
        categoryCounts[catName]++;
    });

    // 1. Kategori Dağılımı (Bar Chart)
    // 1. Kategori Dağılımı (Bar Chart)
    const barCanvas = document.getElementById('categoryBarChart');
    if (barCanvas) {
        if (categoryBarInstance) categoryBarInstance.destroy(); // Eski grafiği temizle

        categoryBarInstance = new Chart(barCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(categoryCounts),
                datasets: [{
                    label: 'Product Count',
                    data: Object.values(categoryCounts),
                    backgroundColor: '#8b5cf6',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                    x: { grid: { display: false } }
                },
                // --- İŞTE BURASI: Çubuğa tıklandığında tetiklenecek fonksiyon ---
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const clickedIndex = elements[0].index;
                        const categoryName = categoryBarInstance.data.labels[clickedIndex];

                        console.log("Grafikten Tıklanan Kategori:", categoryName);

                        // Kategori ismine karşılık gelen ID'yi bulalım
                        const matchedCat = categoriesData.find(c =>
                            (c.categoryName || c.CategoryName || c.name) === categoryName
                        );

                        if (matchedCat) {
                            const catId = matchedCat.categoryId || matchedCat.CategoryID || matchedCat.id;

                            // 1. İlgili kategorinin checkbox'ını ekranda işaretle
                            const checkbox = document.getElementById(`cat_${catId}`);
                            if (checkbox) {
                                checkbox.checked = true;
                            }

                            // 2. Filtreleme fonksiyonunu çalıştır
                            fetchFilteredProducts({ categories: String(catId) });
                        }
                    }
                }
            }
        });
    }

    // 2. Stok Durumu (Doughnut Chart)
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    productsData.forEach(prod => {
        const pStock = prod.unitsInStock !== undefined ? prod.unitsInStock : (prod.UnitsInStock !== undefined ? 
            prod.UnitsInStock : (prod.stock || 0));
        if (pStock === 0) {
            outOfStockCount++;
        } else if (pStock < 10) {
            lowStockCount++;
        } else {
            inStockCount++;
        }
    });

    const doughnutCanvas = document.getElementById('stockDoughnutChart');
    if (doughnutCanvas) {
        if (stockDoughnutInstance) stockDoughnutInstance.destroy(); // Eski grafiği temizle

        stockDoughnutInstance = new Chart(doughnutCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Normal Stock', 'Low Stock', 'Out of Stock'],
                datasets: [{
                    data: [inStockCount, lowStockCount, outOfStockCount],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 11 } }
                    }
                },
                cutout: '70%'
            }
        });
    }
}



function resetModalToCreateMode() {
    const form = document.getElementById("addProductForm");
    if (form) form.reset();

    const modalTitle = document.getElementById("addProductModalLabel");
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add New Product';
    }

    const editIdInput = document.getElementById("editProductId");
    if (editIdInput) {
        editIdInput.remove(); // Gizli ID inputunu sil ki yeni eklemede POST çalışsın
    }
}


async function handleProductSubmit(event) {
    event.preventDefault();

    const name = document.getElementById("productName").value;
    const categoryId = document.getElementById("productCategory").value;
    const unitPrice = document.getElementById("productPrice").value;
    const unitsInStock = document.getElementById("productStock").value;

    const editIdInput = document.getElementById("editProductId");
    const isEditMode = editIdInput && editIdInput.value !== "" && editIdInput.value !== undefined;

    const productData = {
        productName: name,
        categoryId: Number(categoryId),
        unitPrice: Number(unitPrice),
        unitsInStock: Number(unitsInStock)
    };

    let url = '/api/products';
    let method = 'POST';

    if (isEditMode) {
        const idVal = Number(editIdInput.value);
        productData.productId = idVal;
        productData.id = idVal;

        url = `/api/products/${idVal}`;
        method = 'PUT';
    }

    console.log("Çalışan İşlem Modu:", isEditMode ? "GÜNCELLEME (PUT)" : "YENİ EKLEME (POST)");
    console.log("Hedef URL:", url);

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Backend Error Details:", errorBody);
            throw new Error(`Failed to save product. Status: ${response.status}`);
        }

        const modalElement = document.getElementById('addProductModal');
        const modalInstance =
            bootstrap.Modal.getInstance(modalElement) ||
            new bootstrap.Modal(modalElement);

        modalInstance.hide();

        document.getElementById("addProductForm").reset();

        if (editIdInput) {
            editIdInput.remove();
        }

        if (typeof applyFilters === 'function') {
            applyFilters();
        }

        console.log(
            isEditMode
                ? "Product updated successfully!"
                : "Product added successfully!"
        );

    } catch (error) {
        console.error("Error saving product:", error);
        alert("An error occurred while saving the product.");
    }
}


async function editProduct(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);

        if (!response.ok) {
            throw new Error("Failed to fetch product details.");
        }

        const product = await response.json();

        document.getElementById("productName").value = product.productName;
        document.getElementById("productCategory").value = product.categoryId;
        document.getElementById("productPrice").value = product.unitPrice;
        document.getElementById("productStock").value = product.unitsInStock;

        document.getElementById("addProductModalLabel").innerHTML =
            '<i class="bi bi-pencil-square me-2"></i>Edit Product';

        const form = document.getElementById("addProductForm");

        let editIdInput = document.getElementById("editProductId");

        if (!editIdInput) {
            editIdInput = document.createElement("input");
            editIdInput.type = "hidden";
            editIdInput.id = "editProductId";
            form.appendChild(editIdInput);
        }

        editIdInput.value = productId;

        const modalElement = document.getElementById('addProductModal');
        const modalInstance = new bootstrap.Modal(modalElement);

        modalInstance.show();

    } catch (error) {
        console.error("Error loading product for edit:", error);
        alert("Could not load product details.");
    }
}


async function deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error("Failed to delete product.");
        }

        console.log("Product deleted successfully.");

        if (typeof applyFilters === 'function') {
            applyFilters();
        }

    } catch (error) {
        console.error("Error deleting product:", error);
        alert("An error occurred while deleting the product.");
    }
}




let currentSort = { column: null, direction: 0 }; 
let originalData = []; 

let currentPage = 1;
const rowsPerPage = 20;
let totalProductsCount = 0;

function renderTable(products) {
    const tableBody = document.getElementById("productTableBody");
    if (!tableBody) return;

    if (!products || products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No products found.</td></tr>';
        const paginationContainer = document.getElementById("paginationContainer");
        if (paginationContainer) paginationContainer.innerHTML = "";
        updateProductCounts("0", 0);
        return;
    }

    const userRole = localStorage.getItem("role");

    const cleanRole = userRole ? userRole.trim().toLowerCase() : "";

    const isAdmin = (cleanRole === "admin" || cleanRole === "administrator");

    // Sayfalandırma hesabı
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = products.slice(start, end);

    let tableRowsHtml = "";
    paginatedItems.forEach(product => {
        const pId = product.productId || product.ProductID || product.id || 0;
        const pName = product.productName || product.ProductName || product.name || "N/A";
        const pPrice = product.unitPrice || product.UnitPrice || product.price || 0;
        const pStock = product.unitsInStock ?? product.UnitsInStock ?? product.stock ?? 0;
        const pCategory = product.categoryName || product.CategoryName || (product.category ? product.category.categoryName : 'General');

        let stockBadgeClass = pStock === 0 ? 'bg-danger bg-opacity-10 text-danger' :
            (pStock < 10 ? 'bg-warning bg-opacity-10 text-warning' : 'bg-success bg-opacity-10 text-success');

        // Sadece Admin yetkisi varsa düzenleme/silme butonlarını ekle
        let actionButtonsHtml = "";
        if (isAdmin) {
            actionButtonsHtml = `
                <td class="text-end pe-3">
                    <button class="btn btn-sm btn-light text-primary border-0 p-1 me-1" 
                    onclick="editProduct(${pId})" title="Edit"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-light text-danger border-0 p-1" 
                    onclick="deleteProduct(${pId})" title="Delete"><i class="bi bi-trash-fill"></i></button>
                </td>
            `;
        } else {
            actionButtonsHtml = `<td class="text-end pe-3 text-muted">-</td>`;
        }

        tableRowsHtml += `
            <tr>
                <td class="fw-semibold text-muted ps-3">#${pId}</td>
                <td><div class="fw-bold text-dark text-truncate" style="max-width: 180px;">${pName}</div></td>
                <td>$${Number(pPrice).toFixed(2)}</td>
                <td><span class="badge ${stockBadgeClass} px-2 py-1">${pStock} Units</span></td>
                <td><span class="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1">${pCategory}</span></td>
                ${actionButtonsHtml}
            </tr>`;
    });

    tableBody.innerHTML = tableRowsHtml;
    renderPaginationControls(products.length);

    const displayStart = ((currentPage - 1) * rowsPerPage) + 1;
    const displayEnd = Math.min(currentPage * rowsPerPage, products.length);
    updateProductCounts(`${displayStart}-${displayEnd}`, products.length);
}

function renderPaginationControls(totalItems) {
    const container = document.getElementById("paginationContainer");
    if (!container) return;

    const totalPages = Math.ceil(totalItems / rowsPerPage);

    // Eğer tek sayfa varsa sayfalama çubuğunu gizleyebiliriz
    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = `<nav><ul class="pagination justify-content-center mt-3">`;

    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="changePage(${i},${totalItems})">${i}</button>
                 </li>`;
    }

    html += `</ul></nav>`;
    container.innerHTML = html;
}

function changePage(page, productCount) {
    currentPage = page;
    renderTable(originalData);
}

function updateProductCounts(showingText, totalItems) {
    const showingRangeEl = document.getElementById("showingRange");
    const totalCountEl = document.getElementById("totalCount");

    if (showingRangeEl) showingRangeEl.innerText = showingText;
    if (totalCountEl) totalCountEl.innerText = totalItems;
}


function updateProductCounts(showingText, totalItems) {
    const showingRangeEl = document.getElementById("showingRange");
    const totalCountEl = document.getElementById("totalCount");

    if (showingRangeEl) showingRangeEl.innerText = showingText;
    if (totalCountEl) totalCountEl.innerText = totalItems;
}


function sortProducts(column) {
    if (currentSort.column !== column) {
        currentSort = { column: column, direction: 1 };
    } else {
        currentSort.direction = (currentSort.direction + 1) % 3;
    }

    let sortedProducts = [...originalData];

    if (currentSort.direction === 0) {
        // Varsayılan: ID'ye göre sırala
        sortedProducts.sort((a, b) => (a.productId || a.id || 0) - (b.productId || b.id || 0));
    } else {
        // Artan (1) veya Azalan (2)
        sortedProducts.sort((a, b) => {
            // BURASI DÜZELTİLDİ: 0 değerini yutmaması için doğrudan ilgili sütun kontrolü yapılır
            let valA = 0;
            let valB = 0;

            if (column === 'unitsInStock') {
                valA = Number(a.unitsInStock ?? a.UnitsInStock ?? a.stock ?? 0);
                valB = Number(b.unitsInStock ?? b.UnitsInStock ?? b.stock ?? 0);
            } else if (column === 'unitPrice') {
                valA = Number(a.unitPrice || a.UnitPrice || a.price || 0);
                valB = Number(b.unitPrice || b.UnitPrice || b.price || 0);
            } else {
                valA = parseFloat(a[column] || 0);
                valB = parseFloat(b[column] || 0);
            }

            return currentSort.direction === 1 ? valA - valB : valB - valA;
        });
    }

    // 1. Tabloyu güncelle
    renderTable(sortedProducts);

    // 2. Kartları güncelle
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    sortedProducts.forEach(p => {
        const pPrice = p.unitPrice || p.UnitPrice || p.price || 0;
        const pStock = p.unitsInStock ?? p.UnitsInStock ?? p.stock ?? 0;

        totalValue += (pPrice * pStock);

        if (pStock === 0) {
            outOfStockCount++;
        } else if (pStock < 10) {
            lowStockCount++;
        }
    });

    updateSummaryCards(sortedProducts.length, totalValue, lowStockCount, outOfStockCount);
}



async function fetchFilteredProducts(filters = {}) {
    try {
        const cleanFilters = {};
        for (const key in filters) {
            if (filters[key] !== "" && filters[key] !== null && filters[key] !== undefined) {
                cleanFilters[key] = filters[key];
            }
        }

        const queryParams = new URLSearchParams(cleanFilters);
        const response = await fetch(`/api/products?${queryParams.toString()}`);

        if (!response.ok) throw new Error(`API yanıt vermedi (${response.status})`);

        const products = await response.json();

        // 1. Veriyi orijinal haliyle sakla
        originalData = [...products];

        // 2. Tabloyu güncelle
        renderTable(products);

        // 3. İŞTE BURASI: Kartları güncelleyen kısım
        let totalValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        products.forEach(p => {
            const pPrice = p.unitPrice || p.UnitPrice || p.price || 0;
            const pStock = p.unitsInStock ?? p.UnitsInStock ?? p.stock ?? 0;

            totalValue += (pPrice * pStock);

            if (pStock === 0) {
                outOfStockCount++;
            } else if (pStock < 10) {
                lowStockCount++;
            }
        });

        updateSummaryCards(products.length, totalValue, lowStockCount, outOfStockCount);

        // 4. Grafikleri güncelle (Eğer varsa)
        if (typeof fetchCategoriesAndRenderCharts === 'function') {
            fetchCategoriesAndRenderCharts(products);
        }

    } catch (error) {
        console.error("Veri çekme hatası:", error);
    }
}


function updateSummaryCards(totalProducts, totalValue, lowStock, outOfStock) {
    const elTotal = document.getElementById("statTotalProducts");
    const elValue = document.getElementById("statTotalValue");
    const elLow = document.getElementById("statLowStock");
    const elOut = document.getElementById("statOutOfStock");

    if (elTotal) elTotal.innerText = totalProducts;
    if (elValue) elValue.innerText = "$" + totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (elLow) elLow.innerText = lowStock;
    if (elOut) elOut.innerText = outOfStock;
}



document.getElementById("tableSearchInput").addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    const filtered = originalData.filter(product => {
        const pName = (product.productName || product.ProductName || product.name || "").toLowerCase();
        const pId = String(product.productId || product.ProductID || product.id || "");
        return pName.includes(searchTerm) || pId.includes(searchTerm);
    });

    currentPage = 1;
    renderTable(filtered); // Tabloyu güncelle

    // --- BURAYI EKLEMEK İSTER MİSİN? ---
    // Arama yapıldığında grafikler de sadece bulunan ürünlere göre güncellensin:
    if (typeof fetchCategoriesAndRenderCharts === 'function') {
        fetchCategoriesAndRenderCharts(filtered);
    }
});


function exportTableToExcel() {
    // Eğer orijinal veri dizisi boşsa kullanıcıyı uyar
    if (!originalData || originalData.length === 0) {
        alert("No product data found to export!");
        return;
    }

    // Excel için verileri düzenli bir formatta hazırlayalım
    const excelData = originalData.map(product => ({
        "ID": product.productId || product.ProductID || product.id || 0,
        "Product Name": product.productName || product.ProductName || product.name || "N/A",
        "Unit Price ($)": Number(product.unitPrice || product.UnitPrice || product.price || 0).toFixed(2),
        "Units In Stock": product.unitsInStock ?? product.UnitsInStock ?? product.stock ?? 0,
        "Category": product.categoryName || product.CategoryName || 
        (product.category ? product.category.categoryName : 'General')
    }));

    // SheetJS ile JSON verisini çalışma sayfasına dönüştür
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Excel dosyasını indir
    XLSX.writeFile(workbook, "Report.xlsx");
}


