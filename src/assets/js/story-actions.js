function storyStepFromScreen(screen) {
    return {
        id:uid('step'), screenId:screen.id, title:screen.name.replace(/\.[^.]+$/,''),
        userAction:screen.analysis?.userAction || '',
        screenContent:screen.analysis?.screenContent || '',
        nextAction:screen.analysis?.nextAction || '',
        narrateBefore:'', narrateAfter:'', comment:'',
        annotations:structuredClone(screen.annotations || []),
        transition:{type:'slide-left',duration:.6,easing:'ease-in-out',scrollDistancePx:300},
        interaction:{enabled:true,type:'tap',xPercent:50,yPercent:50,label:'Continue'}, dwellSeconds:3.5
    };
}

function addScreensToStory(screenIds) {
    const project = activeProject();
    const wanted = new Set(screenIds);
    const screens = project.screenshots.filter(screen => wanted.has(screen.id));
    if (!screens.length) return 0;
    let story = activeStory();
    if (!story) {
        story = newStory('Primary walkthrough');
        project.stories.push(story);
        project.activeStoryId = story.id;
    }
    const steps = screens.map(storyStepFromScreen);
    story.steps.push(...steps);
    story.activeStepId = steps.at(-1).id;
    project.activeStoryId = story.id;
    persist();
    toast(screens.length === 1
        ? `Added “${screens[0].name}” to ${story.name}.`
        : `Added ${screens.length} photos to ${story.name} in library order.`);
    return screens.length;
}

function addScreenToStory(screenId) {
    return addScreensToStory([screenId]);
}

function newStory(name) {
    const now = Date.now();
    return {id:uid('story'),name,description:'A new documented product journey.',category:DEFAULT_STORY_CATEGORY,folder:selectedFolder || '',steps:[],settings:{defaultSpeed:1,autoAdvance:false,interactiveHotspots:true,showDeviceMockup:true,deviceType:'iphone'},createdAt:now,updatedAt:now};
}

function moveStep(direction) {
    const story = activeStory();
    const step = activeStep();
    if (!story || !step) return;
    const index = story.steps.findIndex(item => item.id === step.id);
    const target = index + Number(direction);
    if (target < 0 || target >= story.steps.length) return;
    [story.steps[index], story.steps[target]] = [story.steps[target], story.steps[index]];
    persist(true);
}

function reorderStoryStep(stepId, targetId, placeAfter = false) {
    const story = activeStory();
    if (!story || !stepId || !targetId || stepId === targetId) return false;
    const sourceIndex = story.steps.findIndex(step => step.id === stepId);
    const targetIndex = story.steps.findIndex(step => step.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return false;
    const [step] = story.steps.splice(sourceIndex, 1);
    const adjustedTarget = story.steps.findIndex(item => item.id === targetId);
    story.steps.splice(adjustedTarget + (placeAfter ? 1 : 0), 0, step);
    story.activeStepId = step.id;
    persist(true);
    return true;
}
