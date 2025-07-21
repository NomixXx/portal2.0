// Application State
let appState = {
    currentUser: null,
    users: [
        {
            id: '1',
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            createdAt: new Date()
        },
        {
            id: '2',
            username: 'moderator',
            password: 'admin123',
            role: 'moderator',
            createdAt: new Date()
        }
    ],
    menuSections: [
        {
            id: '1',
            title: 'Раздел 1',
            order: 1,
            allowedRoles: ['admin', 'moderator', 'user'],
            subsections: [
                {
                    id: '1-1',
                    title: 'Google Документ',
                    type: 'google-doc',
                    googleDocId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
                    embedWidth: '100%',
                    embedHeight: '600px',
                    order: 1
                },
                {
                    id: '1-2',
                    title: 'Текстовый контент',
                    type: 'content',
                    content: 'Это пример текстового контента для демонстрации системы управления контентом UP TAXI.',
                    order: 2
                }
            ]
        },
        {
            id: '2',
            title: 'Раздел 2',
            order: 2,
            allowedRoles: ['admin', 'moderator'],
            subsections: [
                {
                    id: '2-1',
                    title: 'Внешняя ссылка',
                    type: 'link',
                    url: 'https://example.com',
                    order: 1
                },
                {
                    id: '2-2',
                    title: 'Администраторский контент',
                    type: 'content',
                    content: 'Этот контент доступен только администраторам и модераторам.',
                    order: 2
                }
            ]
        },
        {
            id: '3',
            title: 'Раздел 3',
            order: 3,
            allowedRoles: ['admin'],
            subsections: [
                {
                    id: '3-1',
                    title: 'Только для админов',
                    type: 'content',
                    content: 'Этот раздел доступен только администраторам системы.',
                    order: 1
                }
            ]
        }
    ],
    activeSection: null,
    activeSubsection: null,
    isAdminPanelOpen: false,
    editingUser: null,
    editingSection: null,
    editingSubsection: null
};

// DOM Elements
const loginForm = document.getElementById('loginForm');
const mainApp = document.getElementById('mainApp');
const loginFormElement = document.getElementById('loginFormElement');
const loginError = document.getElementById('loginError');
const currentUsername = document.getElementById('currentUsername');
const currentUserRole = document.getElementById('currentUserRole');
const adminPanelBtn = document.getElementById('adminPanelBtn');
const logoutBtn = document.getElementById('logoutBtn');
const mainMenu = document.getElementById('mainMenu');
const subMenu = document.getElementById('subMenu');
const contentArea = document.getElementById('contentArea');
const adminPanel = document.getElementById('adminPanel');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    initializeEventListeners();
    
    if (appState.currentUser) {
        showMainApp();
    } else {
        showLoginForm();
    }
});

// Local Storage Functions
function saveToLocalStorage() {
    localStorage.setItem('uptaxi_users', JSON.stringify(appState.users));
    localStorage.setItem('uptaxi_menuSections', JSON.stringify(appState.menuSections));
    if (appState.currentUser) {
        localStorage.setItem('uptaxi_currentUser', JSON.stringify(appState.currentUser));
    }
}

function loadFromLocalStorage() {
    const savedUsers = localStorage.getItem('uptaxi_users');
    const savedMenuSections = localStorage.getItem('uptaxi_menuSections');
    const savedCurrentUser = localStorage.getItem('uptaxi_currentUser');
    
    if (savedUsers) {
        appState.users = JSON.parse(savedUsers);
    }
    
    if (savedMenuSections) {
        appState.menuSections = JSON.parse(savedMenuSections);
    }
    
    if (savedCurrentUser) {
        appState.currentUser = JSON.parse(savedCurrentUser);
    }
}

// Event Listeners
function initializeEventListeners() {
    // Login
    loginFormElement.addEventListener('submit', handleLogin);
    
    // Header
    logoutBtn.addEventListener('click', handleLogout);
    adminPanelBtn.addEventListener('click', toggleAdminPanel);
    
    // Admin Panel
    document.getElementById('closeAdminPanel').addEventListener('click', closeAdminPanel);
    document.getElementById('usersTab').addEventListener('click', () => showAdminTab('users'));
    document.getElementById('menuTab').addEventListener('click', () => showAdminTab('menu'));
    
    // User Management
    document.getElementById('createUserBtn').addEventListener('click', showCreateUserForm);
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);
    document.getElementById('cancelUserBtn').addEventListener('click', hideCreateUserForm);
    
    // Menu Management
    document.getElementById('createSectionBtn').addEventListener('click', showCreateSectionForm);
    document.getElementById('saveSectionBtn').addEventListener('click', saveSection);
    document.getElementById('cancelSectionBtn').addEventListener('click', hideCreateSectionForm);
    
    // Subsection Modal
    document.getElementById('closeSubsectionModal').addEventListener('click', closeSubsectionModal);
    document.getElementById('saveSubsectionBtn').addEventListener('click', saveSubsection);
    document.getElementById('cancelSubsectionBtn').addEventListener('click', closeSubsectionModal);
    document.getElementById('subsectionType').addEventListener('change', handleSubsectionTypeChange);
    
    // Image Upload
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const user = appState.users.find(u => u.username === username);
    
    if (user && password === user.password) {
        appState.currentUser = user;
        saveToLocalStorage();
        showMainApp();
        loginError.textContent = '';
    } else {
        loginError.textContent = 'Неверные учетные данные';
    }
}

function handleLogout() {
    appState.currentUser = null;
    appState.activeSection = null;
    appState.activeSubsection = null;
    localStorage.removeItem('uptaxi_currentUser');
    showLoginForm();
}

function showLoginForm() {
    loginForm.classList.remove('hidden');
    mainApp.classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function showMainApp() {
    loginForm.classList.add('hidden');
    mainApp.classList.remove('hidden');
    
    currentUsername.textContent = appState.currentUser.username;
    currentUserRole.textContent = `(${getRoleDisplayName(appState.currentUser.role)})`;
    
    if (appState.currentUser.role === 'admin') {
        adminPanelBtn.classList.remove('hidden');
    } else {
        adminPanelBtn.classList.add('hidden');
    }
    
    renderMenu();
    renderContent();
}

// Menu Rendering
function renderMenu() {
    const menuSections = document.getElementById('menuSections');
    menuSections.innerHTML = '';
    
    const filteredSections = appState.menuSections.filter(section =>
        section.allowedRoles.includes(appState.currentUser.role)
    );
    
    filteredSections.forEach(section => {
        const menuItem = document.createElement('button');
        menuItem.className = `menu-item ${appState.activeSection === section.id ? 'active' : ''}`;
        menuItem.innerHTML = `
            <span>${section.title}</span>
            <i class="fas fa-chevron-right"></i>
        `;
        menuItem.addEventListener('click', () => handleSectionClick(section.id));
        menuSections.appendChild(menuItem);
    });
}

function renderSubMenu() {
    const activeSection = appState.menuSections.find(s => s.id === appState.activeSection);
    
    if (!activeSection) {
        subMenu.classList.add('hidden');
        return;
    }
    
    subMenu.classList.remove('hidden');
    document.getElementById('subMenuTitle').textContent = activeSection.title;
    
    const subMenuSections = document.getElementById('subMenuSections');
    subMenuSections.innerHTML = '';
    
    activeSection.subsections.forEach(subsection => {
        const submenuItem = document.createElement('button');
        submenuItem.className = `submenu-item ${appState.activeSubsection === subsection.id ? 'active' : ''}`;
        submenuItem.textContent = subsection.title;
        submenuItem.addEventListener('click', () => handleSubsectionClick(subsection.id));
        subMenuSections.appendChild(submenuItem);
    });
}

function handleSectionClick(sectionId) {
    if (appState.activeSection === sectionId) {
        appState.activeSection = null;
        appState.activeSubsection = null;
    } else {
        appState.activeSection = sectionId;
        appState.activeSubsection = null;
    }
    
    renderMenu();
    renderSubMenu();
    renderContent();
}

function handleSubsectionClick(subsectionId) {
    appState.activeSubsection = subsectionId;
    renderSubMenu();
    renderContent();
}

// Content Rendering
function renderContent() {
    if (!appState.activeSubsection) {
        contentArea.innerHTML = `
            <div class="welcome-message">
                <h2>Добро пожаловать в UP TAXI</h2>
                <p>Выберите раздел из меню для просмотра контента</p>
            </div>
        `;
        return;
    }
    
    const activeSection = appState.menuSections.find(s => s.id === appState.activeSection);
    const activeSubsection = activeSection?.subsections.find(s => s.id === appState.activeSubsection);
    
    if (!activeSubsection) return;
    
    let content = '';
    
    switch (activeSubsection.type) {
        case 'google-doc':
            content = `
                <iframe 
                    src="https://docs.google.com/document/d/${activeSubsection.googleDocId}/edit?usp=sharing"
                    width="${activeSubsection.embedWidth || '100%'}"
                    height="${activeSubsection.embedHeight || '600px'}"
                    class="content-frame"
                    title="${activeSubsection.title}">
                </iframe>
            `;
            break;
        case 'link':
            content = `
                <iframe 
                    src="${activeSubsection.url}"
                    width="100%"
                    height="600px"
                    class="content-frame"
                    title="${activeSubsection.title}">
                </iframe>
            `;
            break;
        case 'content':
            content = `
                <div class="content-text">
                    <h2>${activeSubsection.title}</h2>
                    <p>${activeSubsection.content}</p>
                </div>
            `;
            break;
        case 'image':
            content = `
                <div class="content-image">
                    <h2>${activeSubsection.title}</h2>
                    <img src="${activeSubsection.imageUrl}" alt="${activeSubsection.title}" class="content-img">
                </div>
            `;
            break;
    }
    
    contentArea.innerHTML = content;
}

// Admin Panel
function toggleAdminPanel() {
    if (appState.isAdminPanelOpen) {
        closeAdminPanel();
    } else {
        openAdminPanel();
    }
}

function openAdminPanel() {
    appState.isAdminPanelOpen = true;
    adminPanel.classList.remove('hidden');
    showAdminTab('users');
}

function closeAdminPanel() {
    appState.isAdminPanelOpen = false;
    adminPanel.classList.add('hidden');
}

function showAdminTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
    
    // Show/hide sections
    document.getElementById('usersManagement').classList.toggle('hidden', tab !== 'users');
    document.getElementById('menuManagement').classList.toggle('hidden', tab !== 'menu');
    
    if (tab === 'users') {
        renderUsersTable();
    } else if (tab === 'menu') {
        renderMenuManagement();
    }
}

// User Management
function showCreateUserForm() {
    document.getElementById('createUserForm').classList.remove('hidden');
}

function hideCreateUserForm() {
    document.getElementById('createUserForm').classList.add('hidden');
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newRole').value = 'user';
    appState.editingUser = null;
    document.getElementById('saveUserBtn').innerHTML = '<i class="fas fa-save"></i> Сохранить';
}

function saveUser() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }
    
    if (appState.editingUser) {
        // Update existing user
        const userIndex = appState.users.findIndex(u => u.id === appState.editingUser);
        if (userIndex !== -1) {
            appState.users[userIndex] = {
                ...appState.users[userIndex],
                username,
                password,
                role
            };
        }
        appState.editingUser = null;
    } else {
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            username,
            password,
            role,
            createdAt: new Date()
        };
        appState.users.push(newUser);
    }
    
    saveToLocalStorage();
    hideCreateUserForm();
    renderUsersTable();
}

function renderUsersTable() {
    const usersTable = document.getElementById('usersTable');
    
    let tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>ПОЛЬЗОВАТЕЛЬ</th>
                    <th>ПАРОЛЬ</th>
                    <th>РОЛЬ</th>
                    <th>ДАТА СОЗДАНИЯ</th>
                    <th>ДЕЙСТВИЯ</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    appState.users.forEach(user => {
        tableHTML += `
            <tr>
                <td><span class="font-medium">${user.username}</span></td>
                <td>
                    <div class="password-field">
                        <span class="password-display" id="password-${user.id}">••••••••</span>
                        <button class="password-toggle" onclick="togglePassword('${user.id}', '${user.password}')" title="Показать/скрыть пароль">
                            <i class="fas fa-eye" id="eye-${user.id}"></i>
                        </button>
                    </div>
                </td>
                <td><span class="role-badge role-${user.role}">${getRoleDisplayName(user.role)}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="editUser('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    usersTable.innerHTML = tableHTML;
}

function editUser(userId) {
    const user = appState.users.find(u => u.id === userId);
    if (user) {
        appState.editingUser = userId;
        document.getElementById('newUsername').value = user.username;
        document.getElementById('newPassword').value = user.password;
        document.getElementById('newRole').value = user.role;
        document.getElementById('saveUserBtn').innerHTML = '<i class="fas fa-save"></i> Обновить';
        showCreateUserForm();
    }
}

function deleteUser(userId) {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        appState.users = appState.users.filter(u => u.id !== userId);
        saveToLocalStorage();
        renderUsersTable();
    }
}

function togglePassword(userId, password) {
    const passwordDisplay = document.getElementById(`password-${userId}`);
    const eyeIcon = document.getElementById(`eye-${userId}`);
    
    if (passwordDisplay.textContent === '••••••••') {
        passwordDisplay.textContent = password;
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordDisplay.textContent = '••••••••';
        eyeIcon.className = 'fas fa-eye';
    }
}

// Menu Management
function showCreateSectionForm() {
    document.getElementById('createSectionForm').classList.remove('hidden');
    document.getElementById('saveSectionBtn').innerHTML = '<i class="fas fa-save"></i> Сохранить';
    appState.editingSection = null;
}

function hideCreateSectionForm() {
    document.getElementById('createSectionForm').classList.add('hidden');
    document.getElementById('newSectionTitle').value = '';
    document.querySelectorAll('#createSectionForm input[type="checkbox"]').forEach(cb => cb.checked = true);
    appState.editingSection = null;
}

function saveSection() {
    const title = document.getElementById('newSectionTitle').value;
    const allowedRoles = Array.from(document.querySelectorAll('#createSectionForm input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    if (!title || allowedRoles.length === 0) {
        alert('Заполните все поля и выберите хотя бы одну роль');
        return;
    }
    
    if (appState.editingSection) {
        // Update existing section
        const sectionIndex = appState.menuSections.findIndex(s => s.id === appState.editingSection);
        if (sectionIndex !== -1) {
            appState.menuSections[sectionIndex] = {
                ...appState.menuSections[sectionIndex],
                title,
                allowedRoles
            };
        }
        appState.editingSection = null;
    } else {
        // Create new section
        const newSection = {
            id: Date.now().toString(),
            title,
            order: appState.menuSections.length + 1,
            allowedRoles,
            subsections: []
        };
        appState.menuSections.push(newSection);
    }
    
    saveToLocalStorage();
    hideCreateSectionForm();
    renderMenuManagement();
    renderMenu();
}

function renderMenuManagement() {
    const sectionsContainer = document.getElementById('sectionsContainer');
    sectionsContainer.innerHTML = '';
    
    appState.menuSections.forEach(section => {
        const sectionCard = document.createElement('div');
        sectionCard.className = 'section-card';
        
        sectionCard.innerHTML = `
            <div class="section-header-card">
                <div class="section-info">
                    <h4>${section.title}</h4>
                    <p>Доступ: ${section.allowedRoles.map(role => getRoleDisplayName(role)).join(', ')}</p>
                </div>
                <div class="section-actions">
                    <button class="action-btn edit" onclick="editSection('${section.id}')" title="Редактировать раздел">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn edit" onclick="createSubsection('${section.id}')" title="Добавить подраздел">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteSection('${section.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="section-body">
                <div class="subsections-list">
                    ${section.subsections.map(subsection => `
                        <div class="subsection-item">
                            <div class="subsection-info">
                                <i class="subsection-icon ${getTypeIcon(subsection.type)}"></i>
                                <span class="subsection-title">${subsection.title}</span>
                                <span class="subsection-type">(${getTypeDisplayName(subsection.type)})</span>
                            </div>
                            <div class="subsection-actions">
                                <button class="action-btn edit" onclick="editSubsection('${section.id}', '${subsection.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="deleteSubsection('${section.id}', '${subsection.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        sectionsContainer.appendChild(sectionCard);
    });
}

function editSection(sectionId) {
    const section = appState.menuSections.find(s => s.id === sectionId);
    if (section) {
        appState.editingSection = sectionId;
        document.getElementById('newSectionTitle').value = section.title;
        
        // Reset checkboxes
        document.querySelectorAll('#createSectionForm input[type="checkbox"]').forEach(cb => {
            cb.checked = section.allowedRoles.includes(cb.value);
        });
        
        document.getElementById('saveSectionBtn').innerHTML = '<i class="fas fa-save"></i> Обновить';
        showCreateSectionForm();
    }
}

function deleteSection(sectionId) {
    if (confirm('Вы уверены, что хотите удалить этот раздел?')) {
        appState.menuSections = appState.menuSections.filter(s => s.id !== sectionId);
        saveToLocalStorage();
        renderMenuManagement();
        renderMenu();
    }
}

function createSubsection(sectionId) {
    appState.editingSubsection = { sectionId, subsection: null };
    document.getElementById('subsectionModalTitle').textContent = 'Создать подраздел';
    clearSubsectionForm();
    document.getElementById('subsectionModal').classList.remove('hidden');
}

function editSubsection(sectionId, subsectionId) {
    const section = appState.menuSections.find(s => s.id === sectionId);
    const subsection = section?.subsections.find(s => s.id === subsectionId);
    
    if (subsection) {
        appState.editingSubsection = { sectionId, subsection };
        document.getElementById('subsectionModalTitle').textContent = 'Редактировать подраздел';
        fillSubsectionForm(subsection);
        document.getElementById('subsectionModal').classList.remove('hidden');
    }
}

function deleteSubsection(sectionId, subsectionId) {
    if (confirm('Вы уверены, что хотите удалить этот подраздел?')) {
        const sectionIndex = appState.menuSections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            appState.menuSections[sectionIndex].subsections = 
                appState.menuSections[sectionIndex].subsections.filter(s => s.id !== subsectionId);
            saveToLocalStorage();
            renderMenuManagement();
            renderMenu();
        }
    }
}

function clearSubsectionForm() {
    document.getElementById('subsectionTitle').value = '';
    document.getElementById('subsectionType').value = 'content';
    document.getElementById('subsectionContent').value = '';
    document.getElementById('googleDocId').value = '';
    document.getElementById('embedWidth').value = '100%';
    document.getElementById('embedHeight').value = '600px';
    document.getElementById('subsectionUrl').value = '';
    document.getElementById('imageUrl').value = '';
    handleSubsectionTypeChange();
}

function fillSubsectionForm(subsection) {
    document.getElementById('subsectionTitle').value = subsection.title;
    document.getElementById('subsectionType').value = subsection.type;
    document.getElementById('subsectionContent').value = subsection.content || '';
    document.getElementById('googleDocId').value = subsection.googleDocId || '';
    document.getElementById('embedWidth').value = subsection.embedWidth || '100%';
    document.getElementById('embedHeight').value = subsection.embedHeight || '600px';
    document.getElementById('subsectionUrl').value = subsection.url || '';
    document.getElementById('imageUrl').value = subsection.imageUrl || '';
    handleSubsectionTypeChange();
}

function handleSubsectionTypeChange() {
    const type = document.getElementById('subsectionType').value;
    
    document.getElementById('contentFields').classList.toggle('hidden', type !== 'content');
    document.getElementById('googleDocFields').classList.toggle('hidden', type !== 'google-doc');
    document.getElementById('linkFields').classList.toggle('hidden', type !== 'link');
    document.getElementById('imageFields').classList.toggle('hidden', type !== 'image');
}

function saveSubsection() {
    const title = document.getElementById('subsectionTitle').value;
    const type = document.getElementById('subsectionType').value;
    const content = document.getElementById('subsectionContent').value;
    const googleDocId = document.getElementById('googleDocId').value;
    const embedWidth = document.getElementById('embedWidth').value;
    const embedHeight = document.getElementById('embedHeight').value;
    const url = document.getElementById('subsectionUrl').value;
    const imageUrl = document.getElementById('imageUrl').value;
    
    if (!title) {
        alert('Введите название подраздела');
        return;
    }
    
    const subsectionData = {
        title,
        type,
        order: 1
    };
    
    if (type === 'content') {
        subsectionData.content = content;
    } else if (type === 'google-doc') {
        if (!googleDocId) {
            alert('Введите ID Google документа');
            return;
        }
        subsectionData.googleDocId = googleDocId;
        subsectionData.embedWidth = embedWidth || '100%';
        subsectionData.embedHeight = embedHeight || '600px';
    } else if (type === 'link') {
        if (!url) {
            alert('Введите URL ссылки');
            return;
        }
        subsectionData.url = url;
    } else if (type === 'image') {
        if (!imageUrl) {
            alert('Введите URL изображения или загрузите файл');
            return;
        }
        subsectionData.imageUrl = imageUrl;
    }
    
    const sectionIndex = appState.menuSections.findIndex(s => s.id === appState.editingSubsection.sectionId);
    
    if (appState.editingSubsection.subsection) {
        // Update existing subsection
        const subsectionIndex = appState.menuSections[sectionIndex].subsections
            .findIndex(s => s.id === appState.editingSubsection.subsection.id);
        
        appState.menuSections[sectionIndex].subsections[subsectionIndex] = {
            ...appState.editingSubsection.subsection,
            ...subsectionData
        };
    } else {
        // Create new subsection
        const newSubsection = {
            id: Date.now().toString(),
            ...subsectionData
        };
        
        appState.menuSections[sectionIndex].subsections.push(newSubsection);
    }
    
    saveToLocalStorage();
    closeSubsectionModal();
    renderMenuManagement();
    renderMenu();
}

function closeSubsectionModal() {
    document.getElementById('subsectionModal').classList.add('hidden');
    appState.editingSubsection = null;
}

// Image Upload Handler
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imageUrl').value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Utility Functions
function getRoleDisplayName(role) {
    const roleNames = {
        'admin': 'Администратор',
        'moderator': 'Модератор',
        'user': 'Пользователь'
    };
    return roleNames[role] || role;
}

function getTypeIcon(type) {
    const icons = {
        'google-doc': 'fas fa-file-alt',
        'link': 'fas fa-link',
        'content': 'fas fa-globe',
        'image': 'fas fa-image'
    };
    return icons[type] || 'fas fa-globe';
}

function getTypeDisplayName(type) {
    const typeNames = {
        'google-doc': 'Google документ',
        'link': 'Ссылка',
        'content': 'Контент',
        'image': 'Изображение'
    };
    return typeNames[type] || type;
}

// Global functions for onclick handlers
window.editUser = editUser;
window.deleteUser = deleteUser;
window.editSection = editSection;
window.deleteSection = deleteSection;
window.createSubsection = createSubsection;
window.editSubsection = editSubsection;
window.deleteSubsection = deleteSubsection;
window.togglePassword = togglePassword;