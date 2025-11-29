import { supabase } from './supabaseClient.js';
import { protectPrivatePage } from './auth-oauth.js';

// State Management
let state = {
    projectId: null,
    user: null,
    project: null,
    files: [],
    activeFile: null,
    editor: null,
    saveTimeout: null,
    isResizing: false
};

// DOM Elements
const dom = {
    editorContainer: document.getElementById('monaco-editor'),
    fileList: document.getElementById('file-list'),
    tabs: document.getElementById('editor-tabs'),
    previewFrame: document.getElementById('preview-frame'),
    saveStatus: document.getElementById('save-status'),
    projectName: document.getElementById('project-name'),
    loader: document.getElementById('ide-loader'),
    resizer: document.getElementById('resizer'),
    workspace: document.querySelector('.ide-workspace'),
    previewContainer: document.getElementById('preview-container'),
    refreshBtn: document.getElementById('refresh-preview'),
    downloadBtn: document.getElementById('download-project'),
    deployBtn: document.getElementById('deploy-btn'),
    newTabBtn: document.getElementById('open-new-tab')
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authentication Check
    const session = await protectPrivatePage();
    if (!session) return;
    state.user = session.user;

    // 2. Get Project Context
    const urlParams = new URLSearchParams(window.location.search);
    state.projectId = urlParams.get('id');

    if (!state.projectId) {
        alert("ID de projet manquant.");
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        // 3. Load Data
        await Promise.all([
            loadProjectMetadata(),
            loadProjectFiles()
        ]);

        // 4. Initialize Editor
        await initMonacoEditor();

        // 5. Render UI
        renderFileTree();
        
        // Open index.html by default or first file
        const defaultFile = state.files.find(f => f.name === 'index.html') || state.files[0];
        if (defaultFile) {
            openFile(defaultFile);
        }

        // 6. Setup Event Listeners
        setupEventListeners();
        
        // Hide Loader
        if (dom.loader) dom.loader.style.display = 'none';

    } catch (error) {
        console.error("Erreur d'initialisation de l'éditeur:", error);
        alert("Impossible de charger le projet. Veuillez réessayer.");
    }
});

// --- Data Loading ---

async function loadProjectMetadata() {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', state.projectId)
        .eq('user_id', state.user.id)
        .single();

    if (error) throw error;
    state.project = data;
    if (dom.projectName) dom.projectName.textContent = data.name;
}

async function loadProjectFiles() {
    const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', state.projectId)
        .order('name');

    if (error) throw error;

    if (!data || data.length === 0) {
        // Create default files if empty (First launch)
        await createDefaultFiles();
    } else {
        state.files = data;
    }
}

async function createDefaultFiles() {
    const defaults = [
        {
            project_id: state.projectId,
            name: 'index.html',
            language: 'html',
            content: `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Site</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Bienvenue sur WebForge AI</h1>
        <p>Modifiez ce code pour commencer.</p>
        <button id="click-btn">Cliquez-moi</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`
        },
        {
            project_id: state.projectId,
            name: 'style.css',
            language: 'css',
            content: `body {
    font-family: system-ui, sans-serif;
    background-color: #f3f4f6;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}
.container {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    text-align: center;
}
button {
    background: #6366f1;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 1rem;
}
button:hover {
    background: #4f46e5;
}`
        },
        {
            project_id: state.projectId,
            name: 'script.js',
            language: 'javascript',
            content: `document.getElementById('click-btn').addEventListener('click', () => {
    alert('Le JavaScript fonctionne ! 🚀');
});`
        }
    ];

    const { data, error } = await supabase
        .from('project_files')
        .insert(defaults)
        .select();

    if (error) throw error;
    state.files = data;
}

// --- Monaco Editor ---

function initMonacoEditor() {
    return new Promise((resolve) => {
        // Ensure require is available (loaded via CDN in HTML)
        if (typeof require === 'undefined') {
            console.error('Monaco loader not found');
            return;
        }

        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
        
        require(['vs/editor/editor.main'], function() {
            state.editor = monaco.editor.create(dom.editorContainer, {
                value: '',
                language: 'html',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 15 },
                scrollBeyondLastLine: false,
                tabSize: 2
            });

            // Auto-save trigger
            state.editor.onDidChangeModelContent(() => {
                if (state.activeFile) {
                    // Update local state immediately
                    state.activeFile.content = state.editor.getValue();
                    // Trigger debounce save
                    debouncedSave();
                }
            });

            resolve();
        });
    });
}

// --- File Management ---

function renderFileTree() {
    if (!dom.fileList) return;
    dom.fileList.innerHTML = '';

    state.files.forEach(file => {
        const li = document.createElement('li');
        li.className = `file-item ${state.activeFile && state.activeFile.id === file.id ? 'active' : ''}`;
        
        // Icon logic
        let iconClass = 'fa-file';
        let colorClass = '';
        if (file.name.endsWith('.html')) { iconClass = 'fa-brands fa-html5'; colorClass = 'html'; }
        else if (file.name.endsWith('.css')) { iconClass = 'fa-brands fa-css3-alt'; colorClass = 'css'; }
        else if (file.name.endsWith('.js')) { iconClass = 'fa-brands fa-js'; colorClass = 'js'; }
        else if (file.name.endsWith('.json')) { iconClass = 'fa-solid fa-code'; colorClass = 'json'; }

        li.innerHTML = `
            <span class="file-icon ${colorClass}"><i class="${iconClass}"></i></span>
            ${file.name}
        `;
        
        li.addEventListener('click', () => openFile(file));
        dom.fileList.appendChild(li);
    });
}

function openFile(file) {
    if (state.activeFile && state.activeFile.id === file.id) return;

    state.activeFile = file;
    
    // Update Editor content
    if (state.editor) {
        // Determine language mode
        let lang = 'plaintext';
        if (file.name.endsWith('.html')) lang = 'html';
        else if (file.name.endsWith('.css')) lang = 'css';
        else if (file.name.endsWith('.js')) lang = 'javascript';
        else if (file.name.endsWith('.json')) lang = 'json';

        const model = monaco.editor.createModel(file.content, lang);
        state.editor.setModel(model);
    }

    // Update UI
    renderFileTree();
    renderTabs();
    
    // Refresh preview if opening HTML (optional UX choice)
    if (file.name.endsWith('.html')) {
        updatePreview();
    }
}

function renderTabs() {
    if (!dom.tabs) return;
    dom.tabs.innerHTML = '';
    
    if (state.activeFile) {
        const tab = document.createElement('div');
        tab.className = 'tab active';
        
        let iconClass = 'fa-file';
        if (state.activeFile.name.endsWith('.html')) iconClass = 'fa-brands fa-html5';
        else if (state.activeFile.name.endsWith('.css')) iconClass = 'fa-brands fa-css3-alt';
        else if (state.activeFile.name.endsWith('.js')) iconClass = 'fa-brands fa-js';

        tab.innerHTML = `<i class="${iconClass}"></i> ${state.activeFile.name}`;
        dom.tabs.appendChild(tab);
    }
}

// --- Persistence ---

function debouncedSave() {
    // Update UI to "Saving..."
    updateSaveStatus('saving');

    if (state.saveTimeout) clearTimeout(state.saveTimeout);

    state.saveTimeout = setTimeout(async () => {
        try {
            const { error } = await supabase
                .from('project_files')
                .update({ content: state.activeFile.content })
                .eq('id', state.activeFile.id);

            if (error) throw error;

            updateSaveStatus('saved');
            
            // Hot Reload Preview
            updatePreview();

        } catch (err) {
            console.error('Save error:', err);
            updateSaveStatus('error');
        }
    }, 1000); // 1 second debounce
}

function updateSaveStatus(status) {
    if (!dom.saveStatus) return;

    if (status === 'saving') {
        dom.saveStatus.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sauvegarde...';
        dom.saveStatus.className = 'save-status saving';
    } else if (status === 'saved') {
        dom.saveStatus.innerHTML = '<i class="fa-solid fa-check"></i> Enregistré';
        dom.saveStatus.className = 'save-status saved';
    } else if (status === 'error') {
        dom.saveStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Erreur';
        dom.saveStatus.className = 'save-status error';
    }
}

// --- Preview Logic ---

function updatePreview() {
    if (!dom.previewFrame || state.files.length === 0) return;

    // Find core files
    const indexHtml = state.files.find(f => f.name === 'index.html')?.content || '';
    const styleCss = state.files.find(f => f.name === 'style.css')?.content || '';
    const scriptJs = state.files.find(f => f.name === 'script.js')?.content || '';

    // Construct the HTML document
    let finalHtml = indexHtml;

    // Inject CSS
    if (finalHtml.includes('</head>')) {
        finalHtml = finalHtml.replace('</head>', `<style>${styleCss}</style></head>`);
    } else {
        finalHtml += `<style>${styleCss}</style>`;
    }

    // Inject JS (at the end of body)
    if (finalHtml.includes('</body>')) {
        finalHtml = finalHtml.replace('</body>', `<script>${scriptJs}</script></body>`);
    } else {
        finalHtml += `<script>${scriptJs}</script>`;
    }

    // Handle relative links (basic replacement for this demo)
    // In a real production environment, we might use a Service Worker or Blob URLs more extensively.
    
    // Create Blob URL
    const blob = new Blob([finalHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Set Iframe source
    dom.previewFrame.src = url;
}

// --- UI Interactions ---

function setupEventListeners() {
    // Toolbar Buttons
    if (dom.refreshBtn) dom.refreshBtn.addEventListener('click', updatePreview);
    
    if (dom.downloadBtn) dom.downloadBtn.addEventListener('click', downloadProject);
    
    if (dom.deployBtn) dom.deployBtn.addEventListener('click', () => {
        alert("Déploiement vers Vercel/Netlify initié ! (Simulation)");
    });

    if (dom.newTabBtn) dom.newTabBtn.addEventListener('click', () => {
        if (dom.previewFrame.src) {
            window.open(dom.previewFrame.src, '_blank');
        }
    });

    // Resizer Logic
    if (dom.resizer) {
        dom.resizer.addEventListener('mousedown', (e) => {
            state.isResizing = true;
            dom.resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            dom.previewFrame.style.pointerEvents = 'none'; // Prevent iframe capturing mouse events
        });

        document.addEventListener('mousemove', (e) => {
            if (!state.isResizing) return;
            
            const containerWidth = dom.workspace.getBoundingClientRect().width;
            const sidebarWidth = 220; // Fixed width from CSS
            const newPreviewWidth = containerWidth - (e.clientX - sidebarWidth);

            // Constraints
            if (newPreviewWidth > 200 && newPreviewWidth < containerWidth - 300) {
                dom.previewContainer.style.width = `${newPreviewWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (state.isResizing) {
                state.isResizing = false;
                dom.resizer.classList.remove('resizing');
                document.body.style.cursor = 'default';
                dom.previewFrame.style.pointerEvents = 'auto';
                if (state.editor) state.editor.layout(); // Refresh editor layout
            }
        });
    }
}

function downloadProject() {
    // Simple ZIP generation simulation or JSON export
    const projectData = {
        name: state.project.name,
        files: state.files
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${state.project.name.replace(/\s+/g, '_')}_export.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}