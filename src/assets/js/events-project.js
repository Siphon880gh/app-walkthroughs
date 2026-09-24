$('#projectForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    const now = Date.now();
    const story = newStory('Primary walkthrough');
    const project = {id:uid('proj'),name,description:String(data.get('description')||''),activeScreenshotId:'',activeStoryId:story.id,screenshots:[],folders:[{id:uid('folder'),app:name,platform:'Web',fullPath:`${name} / Web`},{id:uid('folder'),app:name,platform:'Mobile',fullPath:`${name} / Mobile`}],stories:[story],createdAt:now,updatedAt:now};
    stopPlayback();
    projects.push(project); activeProjectId = project.id; selectedFolder = null;
    selectedPhotoIds.clear(); selectedPickerScreenIds.clear(); persist();
    $('#projectDialog').close(); event.currentTarget.reset(); setView('screenshots'); toast(`Project “${name}” created.`);
});
