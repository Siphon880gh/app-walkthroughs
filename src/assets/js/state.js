'use strict';

const APP = {
    name: 'StoryFlow Studio',
    storageKey: 'storyflow_projects_v1',
    activeKey: 'storyflow_active_project_id_v1',
    audioKey: 'storyflow_audio_settings_v1',
    storyLayoutKey: 'storyflow_story_layout_v1'
};

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const STORY_CATEGORIES = ['WIP - Collecting', 'WIP - Editing', 'Finalized'];
const DEFAULT_STORY_CATEGORY = STORY_CATEGORIES[0];
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const esc = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const DATA_IMAGE = /^data:image\/(?:png|jpeg|webp|gif|svg\+xml)(?:;|,)/i;
const STORED_IMAGE = /^data\/screenshots\/[a-f0-9]{64}\.(?:png|jpe?g|webp|gif|svg)$/;
const isProjectImage = (value = '') => DATA_IMAGE.test(String(value)) || STORED_IMAGE.test(String(value));
const safeImage = (value = '') => isProjectImage(value) ? esc(value) : '';
const screenUrl = (value = '') => {
    const path = String(value || '');
    if (!STORED_IMAGE.test(path)) return '';
    try { return new URL(path, location.href).href; } catch { return ''; }
};
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const slug = (value) => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'storyflow';
const formatBytes = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1048576).toFixed(1)} MB`;
const normalizeStoryCategory = value => STORY_CATEGORIES.includes(value) ? value : DEFAULT_STORY_CATEGORY;
const normalizeStoryCategoryFilter = value => value === 'all' || STORY_CATEGORIES.includes(value) ? value : 'all';
const storiesForCategory = (stories, category = 'all') => category === 'all'
    ? stories
    : stories.filter(story => normalizeStoryCategory(story.category) === category);
const storyCategoryTone = story => ({
    'WIP - Collecting':'collecting',
    'WIP - Editing':'editing',
    'Finalized':'finalized'
})[normalizeStoryCategory(story?.category)];

let currentView = 'screenshots';
let selectedFolder = null;
let searchTerm = '';
let selectedTool = 'callout-pin';
let selectedColor = PALETTE[0];
let inspectorTab = 'analysis';
let exportScope = 'project';
let playerIndex = 0;
let playerTimer = null;
let playerStartedAt = 0;
let isPlaying = false;
let draftAnnotation = null;
let showRemoveHandles = false;
let selectedAnnotationId = null;
let showAnnotatedScreens = true;
let pickerShowAnnotated = true;
let storyPickerOpen = false;
let playerStoryCategoryFilter = 'all';
let exportStoryCategoryFilter = 'all';
let storyPanelLayout = localStorage.getItem(APP.storyLayoutKey) === 'files-right' ? 'files-right' : 'files-left';
const expandedNarration = new Set();
let syncMenuOpen = false;
let uploadMenuOpen = false;
let libraryListMode = false;
const selectedPhotoIds = new Set();
const selectedPickerScreenIds = new Set();
let sessionUploadOpen = true;
const sessionUploads = [];

const defaultAudio = {
    enabled: true,
    muted: false,
    rate: 1,
    pitch: 1,
    volume: .9,
    readTitle: true,
    readNarrateBefore: true,
    readUserAction: true,
    readScreenContent: true,
    readNextAction: false,
    readNarrateAfter: true,
    advanceOnSpeechEnd: false,
    voiceURI: ''
};

let audioSettings = Object.assign(structuredClone(defaultAudio), loadJson(APP.audioKey, {}));
