function mockScreen(variant) {
    const screens = {
        dashboard: {title:'Good morning, Elena', sub:'Your balance', amount:'$24,860.40', accent:'#3b82f6', cta:'Send money', rows:[['Maya Chen','+$1,240.00'],['Figma, Inc.','−$96.00'],['Cloudworks','−$48.20']]},
        recipient: {title:'Send money', sub:'Choose a recipient', amount:'Who are you paying?', accent:'#6366f1', cta:'Continue', rows:[['Maya Chen','@mayachen'],['Jon Bell','@jonb'],['Avery Smith','@avery']]},
        amount: {title:'Transfer details', sub:'Available · $24,860.40', amount:'$1,200', accent:'#10b981', cta:'Review transfer', rows:[['To','Maya Chen'],['From','Orbit checking ·· 4921'],['Arrival','Instant']]},
        confirm: {title:'Transfer complete', sub:'Sep 22, 2026 · 10:42 AM', amount:'$1,200.00', accent:'#10b981', cta:'Done', rows:[['Sent to','Maya Chen'],['Method','Instant transfer'],['Reference','ORB-448201']]},
        request: {title:'Request money', sub:'Requesting from Maya Chen', amount:'$240', accent:'#8b5cf6', cta:'Send request', rows:[['For','Dinner in Oakland'],['Delivery','Orbit notification'],['Due','Friday, Sep 25']]},
        requestconfirm: {title:'Request sent', sub:'Maya Chen · just now', amount:'$240.00', accent:'#8b5cf6', cta:'Done', rows:[['Status','Waiting for payment'],['Reminder','Automatic in 3 days'],['Reference','REQ-920184']]},
        cards: {title:'Your cards', sub:'Orbit Metal ·· 8842', amount:'$3,480 available', accent:'#f59e0b', cta:'Freeze card', rows:[['Apple Store','−$189.00'],['Netflix','−$22.99'],['Metro Market','−$64.18']]},
        frozen: {title:'Card controls', sub:'Orbit Metal ·· 8842', amount:'Card frozen', accent:'#ef4444', cta:'Unfreeze card', rows:[['Online purchases','Blocked'],['Contactless payments','Blocked'],['Cash withdrawal','Blocked']]}
    };
    const s = screens[variant] || screens.dashboard;
    const rows = s.rows.map((row, i) => `<g transform="translate(28 ${442+i*72})"><rect width="334" height="58" rx="13" fill="#f8fafc"/><circle cx="27" cy="29" r="18" fill="${s.accent}" opacity="${.14 + i*.04}"/><text x="58" y="25" font-family="Arial,sans-serif" font-weight="700" font-size="13" fill="#172033">${row[0]}</text><text x="58" y="43" font-family="Arial,sans-serif" font-size="11" fill="#64748b">${row[1]}</text><path d="M312 25l6 6-6 6" fill="none" stroke="#94a3b8" stroke-width="2"/></g>`).join('');
    const isSuccess = variant === 'confirm' || variant === 'requestconfirm';
    const success = isSuccess ? `<circle cx="195" cy="205" r="42" fill="#dcfce7"/><path d="M175 206l13 13 25-28" fill="none" stroke="#10b981" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` : '';
    const sectionLabel = variant === 'dashboard' ? 'RECENT ACTIVITY' : variant === 'cards' ? 'RECENT CARD ACTIVITY' : variant === 'frozen' ? 'CURRENT RESTRICTIONS' : variant.startsWith('request') ? 'REQUEST SUMMARY' : 'TRANSFER SUMMARY';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844"><rect width="390" height="844" fill="#f1f5f9"/><rect width="390" height="112" fill="#0f172a"/><text x="26" y="43" font-family="Arial,sans-serif" font-weight="700" font-size="14" fill="#e2e8f0">ORBIT PAY</text><circle cx="348" cy="39" r="17" fill="#243249"/><text x="348" y="43" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="11" fill="#bfdbfe">ER</text><text x="26" y="91" font-family="Arial,sans-serif" font-weight="700" font-size="23" fill="#fff">${s.title}</text>${success}<text x="195" y="${isSuccess ? 294 : 167}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#64748b">${s.sub}</text><text x="195" y="${isSuccess ? 335 : 222}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="${variant === 'amount' ? 48 : 35}" fill="#0f172a">${s.amount}</text><rect x="28" y="${isSuccess ? 365 : 269}" width="334" height="58" rx="14" fill="${s.accent}"/><text x="195" y="${isSuccess ? 401 : 305}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="14" fill="#fff">${s.cta}</text><text x="28" y="423" font-family="Arial,sans-serif" font-weight="700" font-size="12" fill="#475569">${sectionLabel}</text>${rows}<rect x="145" y="818" width="100" height="5" rx="3" fill="#cbd5e1"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function seedProjects() {
    const screenDefinitions = [
        ['screen-dashboard', '01_Dashboard.png', 'dashboard'],
        ['screen-recipient', '02_Choose_Recipient.png', 'recipient'],
        ['screen-amount', '03_Transfer_Amount.png', 'amount'],
        ['screen-confirm', '04_Confirmation.png', 'confirm'],
        ['screen-request', '05_Request_Amount.png', 'request'],
        ['screen-request-confirm', '06_Request_Sent.png', 'requestconfirm'],
        ['screen-cards', '07_Card_Overview.png', 'cards'],
        ['screen-frozen', '08_Card_Frozen.png', 'frozen']
    ];
    const analysisByVariant = {
        dashboard:{userAction:'The user reviews their balance and chooses a money action.',screenContent:'Account balance, recent activity, and primary transfer controls are visible.',nextAction:'Open the selected money workflow.'},
        recipient:{userAction:'The user selects Maya Chen from recent recipients.',screenContent:'A searchable recipient list shows recent contacts and usernames.',nextAction:'Continue to the amount screen.'},
        amount:{userAction:'The user enters $1,200 and reviews transfer details.',screenContent:'Amount, recipient, source account, and instant arrival method are visible.',nextAction:'Review and confirm the transfer.'},
        confirm:{userAction:'The user confirms the completed transfer.',screenContent:'Success status, amount, recipient, method, and reference number are visible.',nextAction:'Return to the dashboard.'},
        request:{userAction:'The user requests $240 from Maya for dinner.',screenContent:'Request amount, memo, delivery method, and due date are visible.',nextAction:'Send the payment request.'},
        requestconfirm:{userAction:'The user reviews the sent request.',screenContent:'Pending status, reminder timing, and request reference are visible.',nextAction:'Return to the dashboard or share a reminder.'},
        cards:{userAction:'The user opens card controls after noticing their card is missing.',screenContent:'Available credit, recent charges, and a Freeze card action are visible.',nextAction:'Freeze the card immediately.'},
        frozen:{userAction:'The user confirms that the card is frozen.',screenContent:'Card status and blocked transaction categories are visible.',nextAction:'Leave the card frozen or unfreeze it after recovery.'}
    };
    const screens = screenDefinitions.map(([id, name, variant], index) => ({
        id, name, dataUrl:mockScreen(variant), folder:'Orbit Pay / iOS', app:'Orbit Pay', platform:'iOS', width:390, height:844, deviceFrame:'iphone', tags:['orbit-pay','ios',variant], uploadedAt:Date.now() - (screenDefinitions.length-index)*86400000,
        analysis:structuredClone(analysisByVariant[variant]),
        annotations:index === 0 ? [{id:'ann-seed-1',type:'callout-pin',x:49,y:35.5,width:0,height:0,color:'#3b82f6',strokeWidth:3,label:'Primary transfer action',numberBadge:1}] : []
    }));
    const steps = screens.slice(0, 4).map((screen, index) => ({
        id:`step-${index+1}`, screenId:screen.id, title:['Review account','Choose recipient','Enter amount','Transfer complete'][index],
        ...structuredClone(screen.analysis), annotations: structuredClone(screen.annotations),
        transition:{type:index === 3 ? 'modal-pop':'slide-left', duration:.6, easing:index === 3 ? 'spring':'ease-in-out', scrollDistancePx:300},
        interaction:{enabled:index < 3,type:'tap',xPercent:50,yPercent:index === 0 ? 35.5 : index === 1 ? 56 : 36,label:index === 0 ? 'Send money' : index === 1 ? 'Select Maya' : 'Review transfer'},
        dwellSeconds:3.5
    }));
    const makeStep = (id, screen, title, interaction, transition = 'slide-left') => ({
        id, screenId:screen.id, title, ...structuredClone(screen.analysis), annotations:structuredClone(screen.annotations),
        transition:{type:transition,duration:.6,easing:transition === 'modal-pop' ? 'spring':'ease-in-out',scrollDistancePx:300},
        interaction:{enabled:Boolean(interaction),type:'tap',xPercent:50,yPercent:interaction?.y || 36,label:interaction?.label || ''},dwellSeconds:3.5
    });
    const requestSteps = [
        makeStep('step-request-recipient', screens[1], 'Choose requester', {label:'Select Maya',y:56}),
        makeStep('step-request-amount', screens[4], 'Set request details', {label:'Send request',y:36}),
        makeStep('step-request-sent', screens[5], 'Request sent', null, 'modal-pop')
    ];
    const cardSteps = [
        makeStep('step-card-dashboard', screens[0], 'Review account', {label:'Open cards',y:35.5}),
        makeStep('step-card-overview', screens[6], 'Open card controls', {label:'Freeze card',y:36}),
        makeStep('step-card-frozen', screens[7], 'Card frozen', null, 'modal-pop')
    ];
    const now = Date.now();
    return [{
        id:'proj-orbit-pay', name:'Orbit Pay — Transfer', description:'A precision handoff for the instant transfer journey.',
        demoSeedVersion:2, activeScreenshotId:screens[0].id, activeStoryId:'story-transfer', screenshots:screens,
        folders:[{id:'folder-ios',app:'Orbit Pay',platform:'iOS',fullPath:'Orbit Pay / iOS'},{id:'folder-web',app:'Orbit Pay',platform:'Web',fullPath:'Orbit Pay / Web'}],
        stories:[
            {id:'story-transfer',name:'Send money flow',description:'From account overview to successful transfer.',folder:'Orbit Pay / iOS',steps,settings:{defaultSpeed:1,autoAdvance:false,interactiveHotspots:true,showDeviceMockup:true,deviceType:'iphone'},createdAt:now,updatedAt:now},
            {id:'story-request',name:'Request dinner payment',description:'Choose a contact, set a request, and verify delivery.',folder:'Orbit Pay / iOS',steps:requestSteps,settings:{defaultSpeed:1,autoAdvance:false,interactiveHotspots:true,showDeviceMockup:true,deviceType:'iphone'},createdAt:now,updatedAt:now},
            {id:'story-freeze-card',name:'Freeze a missing card',description:'Secure a missing card and verify transaction restrictions.',folder:'Orbit Pay / iOS',steps:cardSteps,settings:{defaultSpeed:1,autoAdvance:false,interactiveHotspots:true,showDeviceMockup:true,deviceType:'android'},createdAt:now,updatedAt:now}
        ],
        createdAt:now,updatedAt:now
    }];
}

