'use strict';

const APP = {
    name: 'StoryFlow Studio',
    storageKey: 'storyflow_projects_v1',
    activeKey: 'storyflow_active_project_id_v1',
    audioKey: 'storyflow_audio_settings_v1',
    storyLayoutKey: 'storyflow_story_layout_v1',
    photoDateKey: 'storyflow_photo_date_metadata_v1',
    libraryViewKey: 'storyflow_library_view_v1',
    recentSlideCopyKey: 'storyflow_recent_slide_copies_v1',
    hotspotDirectionKey: 'storyflow_hotspot_direction_v1'
};

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const STORY_STAGES = ['WIP - Collecting', 'WIP - Editing', 'Finalized', 'Treat as Collection'];
const DEFAULT_STORY_STAGE = STORY_STAGES[0];
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
const normalizeStoryStage = value => STORY_STAGES.includes(value) ? value : DEFAULT_STORY_STAGE;
const normalizeStoryStageFilter = value => value === 'all' || STORY_STAGES.includes(value) ? value : 'all';
const storiesForStage = (stories, stage = 'all') => stage === 'all'
    ? stories
    : stories.filter(story => normalizeStoryStage(story.stage) === stage);
const storyStageTone = story => ({
    'WIP - Collecting':'collecting',
    'WIP - Editing':'editing',
    'Finalized':'finalized',
    'Treat as Collection':'collection'
})[normalizeStoryStage(story?.stage)];

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
let canvasFit = 'auto';
let canvasFitOpen = false;
let selectedAnnotationId = null;
let showAnnotatedScreens = true;
let pickerShowAnnotated = true;
let photoPickerSort = 'recent';
let photoPickerGroup = 'date';
let pickerUploadOpen = false;
let pickerUploadFolder = '';
let pickerUploadBusy = false;
let pendingPickerUpload = null;
let pickerMenu = null;
let pickerAssocId = null;
let pickerScrollTop = 0;
let storyPickerOpen = false;
let playerStoryStageFilter = 'all';
let exportStoryStageFilter = 'all';
let storyPanelLayout = localStorage.getItem(APP.storyLayoutKey) === 'files-right' ? 'files-right' : 'files-left';
const expandedNarration = new Set();
let syncMenuOpen = false;
let uploadMenuOpen = false;
let usePhotoMetadataDates = localStorage.getItem(APP.photoDateKey) !== 'false';
// null (closed), 'mode' (Move/Copy chooser), 'move', or 'copy' (destination folders).
let transferMenu = null;
let folderMenuPath = null;
let storyMenuOpen = false;
let copyPreviousOpen = false;
const storedLibraryView = localStorage.getItem(APP.libraryViewKey);
let libraryView = storedLibraryView === 'list' || storedLibraryView === 'urls' ? storedLibraryView : 'grid';
let assocDrawerId = null;
let librarySelectAnchor = null;
let libraryPhotoGroup = 'none';
let libraryStoryFilter = 'all';
let libraryTagFilter = 'all';
let libraryMenu = null;
let libraryAssocId = null;
let libraryFitId = null;
let pendingAnnotationScreenId = null;
let pendingTagPhotoIds = [];
const selectedPhotoIds = new Set();
const selectedPickerScreenIds = new Set();
const selectedStoryStepIds = new Set();
let sessionUploadOpen = true;
const sessionUploads = [];
let pendingUploadFiles = [];

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
