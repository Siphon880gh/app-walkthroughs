'use strict';

const APP = {
    name: 'StoryFlow Studio',
    storageKey: 'storyflow_projects_v1',
    activeKey: 'storyflow_active_project_id_v1',
    audioKey: 'storyflow_audio_settings_v1'
};

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const esc = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const safeImage = (value = '') => /^data:image\/(?:png|jpeg|webp|gif|svg\+xml)(?:;|,)/i.test(String(value)) ? esc(value) : '';
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const slug = (value) => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'storyflow';
const formatBytes = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1048576).toFixed(1)} MB`;

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

const defaultAudio = {
    enabled: true,
    muted: false,
    rate: 1,
    pitch: 1,
    volume: .9,
    readTitle: true,
    readUserAction: true,
    readScreenContent: true,
    readNextAction: false,
    advanceOnSpeechEnd: false,
    voiceURI: ''
};

let audioSettings = loadJson(APP.audioKey, defaultAudio);
