const API_URL = 'http://localhost:5000/certificates';

let allCertificates = []; // Store all certificates globally

AOS.init({
    duration: 800,
    once: true
});

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const maxDate = `${year}-${month}-${day}`;
    
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.max = maxDate;
        dateInput.value = maxDate;
    }
    
    const editDateInput = document.getElementById('editDate');
    if (editDateInput) {
        editDateInput.max = maxDate;
    }
    
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        loadCertificates();
        setupSearch();
        setupFilters();
        updateStats();
    }
    
    if (window.location.pathname.includes('add-certificate')) {
        setupFileUpload();
        document.getElementById('certificateForm').addEventListener('submit', addCertificate);
    }
    
    if (window.location.pathname.includes('edit-certificate')) {
        loadCertificateForEdit();
        document.getElementById('editForm').addEventListener('submit', updateCertificate);
    }
});

async function loadCertificates() {
    try {
        const response = await fetch(`${API_URL}/all`);
        allCertificates = await response.json(); // Store globally
        
        const container = document.getElementById('certificates-container');
        
        if (allCertificates.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state" data-aos="fade-up">
                        <i class="fas fa-certificate"></i>
                        <h4>No Certificates Yet</h4>
                        <p class="text-muted">Start by adding your first certificate.</p>
                        <a href="add-certificate.html" class="btn btn-primary btn-lg mt-3">
                            <i class="fas fa-plus-circle me-2"></i>Add Your First Certificate
                        </a>
                    </div>
                </div>
            `;
            return;
        }
        
        displayCertificates(allCertificates);
        updateFilterDropdown(allCertificates);
        updateStats();
        
    } catch (error) {
        console.error('Error loading certificates:', error);
        showError('Failed to load certificates.');
    }
}

function displayCertificates(certificates) {
    const container = document.getElementById('certificates-container');
    let html = '';
    
    certificates.forEach((cert, index) => {
        let displayDate = 'N/A';
        if (cert.date) {
            const dateObj = new Date(cert.date);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            displayDate = `${day}/${month}/${year}`;
        }
        
        const fileIcon = cert.fileUrl?.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-image';
        const fileColor = cert.fileUrl?.endsWith('.pdf') ? 'text-danger' : 'text-success';
        
        html += `
            <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="certificate-card">
                    <span class="card-badge">
                        <i class="fas fa-calendar-alt me-1"></i>${displayDate}
                    </span>
                    <div class="card-image">
                        <i class="fas ${fileIcon} ${fileColor}"></i>
                    </div>
                    <div class="card-content">
                        <h5 class="card-title">${cert.title}</h5>
                        <p class="card-issuer">
                            <i class="fas fa-building"></i>
                            ${cert.issuer}
                        </p>
                        <div class="card-actions">
                            ${cert.fileUrl ? `
                                <a href="http://localhost:5000/uploads/${cert.fileUrl}" target="_blank" class="btn-action btn-view">
                                    <i class="fas fa-eye"></i>
                                    <span>View</span>
                                </a>
                            ` : ''}
                            <a href="edit-certificate.html?id=${cert._id}" class="btn-action btn-edit">
                                <i class="fas fa-edit"></i>
                                <span>Edit</span>
                            </a>
                            <button class="btn-action btn-delete" onclick="deleteCertificate('${cert._id}')">
                                <i class="fas fa-trash-alt"></i>
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Update filter dropdown with unique issuers
function updateFilterDropdown(certificates) {
    const filterSelect = document.getElementById('filterIssuer');
    if (!filterSelect) return;
    
    const issuers = [...new Set(certificates.map(c => c.issuer))];
    
    let options = '<option value="">All Organizations</option>';
    issuers.forEach(issuer => {
        options += `<option value="${issuer}">${issuer}</option>`;
    });
    
    filterSelect.innerHTML = options;
}

// Setup filter event listeners
function setupFilters() {
    const filterSelect = document.getElementById('filterIssuer');
    const sortSelect = document.getElementById('sortBy');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', applyFilters);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
}

// Apply both filter and sort
function applyFilters() {
    const filterValue = document.getElementById('filterIssuer')?.value || '';
    const sortValue = document.getElementById('sortBy')?.value || 'newest';
    
    // Filter certificates
    let filtered = allCertificates;
    if (filterValue) {
        filtered = allCertificates.filter(cert => cert.issuer === filterValue);
    }
    
    // Sort certificates
    filtered.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        
        if (sortValue === 'newest') {
            return dateB - dateA; // Newest first
        } else {
            return dateA - dateB; // Oldest first
        }
    });
    
    displayCertificates(filtered);
}

async function addCertificate(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('issuer', document.getElementById('issuer').value);
    formData.append('date', document.getElementById('date').value);
    formData.append('file', document.getElementById('file').files[0]);
    
    const submitBtn = document.getElementById('submitBtn');
    const normalState = submitBtn.querySelector('.btn-normal');
    const loadingState = submitBtn.querySelector('.btn-loading');
    
    normalState.classList.add('d-none');
    loadingState.classList.remove('d-none');
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/add`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showSuccess('Certificate uploaded successfully!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        showError('Upload failed. Please try again.');
    } finally {
        normalState.classList.remove('d-none');
        loadingState.classList.add('d-none');
        submitBtn.disabled = false;
    }
}

async function deleteCertificate(id) {
    if (!confirm('Are you sure you want to delete this certificate?')) return;
    
    try {
        const response = await fetch(`${API_URL}/delete/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('Certificate deleted successfully!');
            loadCertificates(); // Reload the list
        }
    } catch (error) {
        showError('Error deleting certificate.');
    }
}

async function loadCertificateForEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/all`);
        const certificates = await response.json();
        const certificate = certificates.find(c => c._id === id);
        
        if (certificate) {
            document.getElementById('certificateId').value = certificate._id;
            document.getElementById('editTitle').value = certificate.title;
            document.getElementById('editIssuer').value = certificate.issuer;
            
            if (certificate.date) {
                const dateObj = new Date(certificate.date);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                document.getElementById('editDate').value = `${year}-${month}-${day}`;
            }
        }
    } catch (error) {
        console.error('Error loading certificate:', error);
    }
}

async function updateCertificate(event) {
    event.preventDefault();
    
    const id = document.getElementById('certificateId').value;
    const data = {
        title: document.getElementById('editTitle').value,
        issuer: document.getElementById('editIssuer').value,
        date: document.getElementById('editDate').value
    };
    
    try {
        const response = await fetch(`${API_URL}/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showSuccess('Certificate updated successfully!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    } catch (error) {
        showError('Update failed.');
    }
}

function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('file');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        });
    });
    
    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        fileInput.files = files;
        updateFilePreview(files[0]);
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) {
            updateFilePreview(fileInput.files[0]);
        }
    });
}

function updateFilePreview(file) {
    const preview = document.getElementById('filePreview');
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <div class="image-preview">
                    <img src="${e.target.result}" alt="Preview" style="max-height: 100px;">
                    <p class="small text-muted mt-2">${file.name}</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = `
            <div class="file-preview">
                <i class="fas fa-file-pdf fa-2x text-danger"></i>
                <span>${file.name}</span>
            </div>
        `;
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterCertificates);
    }
}

function filterCertificates() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = allCertificates.filter(cert => 
        cert.title.toLowerCase().includes(searchTerm) || 
        cert.issuer.toLowerCase().includes(searchTerm)
    );
    
    // Re-apply current filters
    const filterValue = document.getElementById('filterIssuer')?.value || '';
    const sortValue = document.getElementById('sortBy')?.value || 'newest';
    
    if (filterValue) {
        filtered = filtered.filter(cert => cert.issuer === filterValue);
    }
    
    filtered.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        
        if (sortValue === 'newest') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });
    
    displayCertificates(filtered);
}

async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/all`);
        const certificates = await response.json();
        
        document.getElementById('total-certificates').textContent = certificates.length;
        
        const uniqueIssuers = new Set(certificates.map(c => c.issuer)).size;
        document.getElementById('unique-issuers').textContent = uniqueIssuers;
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const recentCount = certificates.filter(c => {
            if (!c.date) return false;
            const certDate = new Date(c.date);
            return certDate.getMonth() === currentMonth && certDate.getFullYear() === currentYear;
        }).length;
        
        document.getElementById('recent-added').textContent = recentCount;
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

function showSuccess(message) {
    const toast = document.getElementById('successToast');
    if (!toast) return;
    toast.querySelector('.toast-message').textContent = message;
    new bootstrap.Toast(toast).show();
}

function showError(message) {
    const toast = document.getElementById('errorToast');
    if (!toast) return;
    toast.querySelector('.toast-message').textContent = message;
    new bootstrap.Toast(toast).show();
}