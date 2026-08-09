// Configuration & State
const STORAGE_KEY = 'dreamofdreams.merch.savedDesigns';
let designs = [];
let currentIndex = 0;
let isGenerating = false;

// DOM Elements
const conceptImg = document.getElementById('concept-image');
const nameEl = document.getElementById('design-name');
const collEl = document.getElementById('collection-name');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const saveBtn = document.getElementById('save-btn');
const loadingEl = document.getElementById('loading-state');

// Initialization
async function init() {
    designs = await fetchDesigns();
    renderDesign();
    updateControls();
}

// Data Access
async function fetchDesigns() {
    const response = await fetch('data/merch-designs.json');
    return await response.json();
}

// UI Rendering
function renderDesign() {
    const design = designs[currentIndex];
    conceptImg.src = design.conceptImageUrl;
    nameEl.textContent = design.name;
    collEl.textContent = design.collection;
    updateSaveButton();
}

function updateControls() {
    prevBtn.disabled = currentIndex === 0;
    // Next button logic handles generation trigger
}

// Browsing State
prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        renderDesign();
        updateControls();
    }
});

nextBtn.addEventListener('click', async () => {
    if (currentIndex < designs.length - 1) {
        currentIndex++;
        renderDesign();
        updateControls();
    } else {
        await requestMoreDesigns();
    }
});

// Generation Service
async function requestMoreDesigns() {
    if (isGenerating) return;
    
    isGenerating = true;
    nextBtn.disabled = true;
    loadingEl.style.display = 'block';
    
    // Simulate async generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newDesigns = [
        {
            "id": `hysco-${Date.now()}`,
            "name": "Generated Concept",
            "collection": "The Prophecy",
            "status": "candidate",
            "conceptImageUrl": "https://via.placeholder.com/400x500?text=New+Design",
            "productionArtworkUrl": null,
            "designElements": ["new"],
            "garments": ["tshirt"],
            "colorPalette": ["navy"],
            "likes": 0,
            "createdAt": new Date().toISOString()
        }
    ];
    
    designs.push(...newDesigns);
    currentIndex++; // Move to first new design
    
    isGenerating = false;
    nextBtn.disabled = false;
    loadingEl.style.display = 'none';
    renderDesign();
}

// Storage
function getSavedDesigns() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveDesign(id) {
    const saved = getSavedDesigns();
    if (!saved.includes(id)) {
        saved.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
    updateSaveButton();
}

function isDesignSaved(id) {
    return getSavedDesigns().includes(id);
}

saveBtn.addEventListener('click', () => {
    saveDesign(designs[currentIndex].id);
});

function updateSaveButton() {
    saveBtn.textContent = isDesignSaved(designs[currentIndex].id) ? 'Saved' : 'Save Design';
    saveBtn.disabled = isDesignSaved(designs[currentIndex].id);
}

init();
