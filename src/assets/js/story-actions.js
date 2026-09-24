function addScreenToStory(screenId) {
    const project = activeProject();
    const screen = screenById(screenId);
    if (!screen) return;
    let story = activeStory();
    if (!story) {
        story = newStory('Primary walkthrough');
        project.stories.push(story);
        project.activeStoryId = story.id;
    }
    const step = {
        id:uid('step'), screenId:screen.id, title:screen.name.replace(/\.[^.]+$/,''),
        userAction:screen.analysis?.userAction || '',
        screenContent:screen.analysis?.screenContent || '',
        nextAction:screen.analysis?.nextAction || '',
        narrateBefore:'', narrateAfter:'', comment:'',
        annotations:structuredClone(screen.annotations || []),
        transition:{type:'slide-left',duration:.6,easing:'ease-in-out',scrollDistancePx:300},
        interaction:{enabled:true,type:'tap',xPercent:50,yPercent:50,label:'Continue'}, dwellSeconds:3.5
    };
    story.steps.push(step);
    story.activeStepId = step.id;
    project.activeStoryId = story.id;
    persist();
    toast(`Added “${screen.name}” to ${story.name}.`);
}

function newStory(name) {
    const now = Date.now();
    return {id:uid('story'),name,description:'A new documented product journey.',folder:selectedFolder || '',steps:[],settings:{defaultSpeed:1,autoAdvance:false,interactiveHotspots:true,showDeviceMockup:true,deviceType:'iphone'},createdAt:now,updatedAt:now};
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
