// dHUB itself: the home page, getting around, and what a visitor needs to know. Only the shell carries this.
assistRegister('hub', {
  name: 'dHUB',
  blurb: 'Ask how something works, in dHUB or in the tool you have open. I answer from notes written for each tool, and I point at the real button when I can.',
  first: ['about', 'apps', 'help', 'data-safety'],
  screen: function(w){ return w.document.body.classList.contains('ws') ? 'ws-' + w._wsSection : 'visitor'; },
  diag: function(w){
    var d = [];
    try {
      if (w.isAdmin && w.hubSyncEnv) {
        var e = w.hubSyncEnv();
        if (e && !e.ok && e.code !== 'pending') d.push({ msg: '**' + e.short + '.** ' + e.fix, t: 'sync' });
      }
    } catch (x) {}
    return d;
  },
  topics: [
    { id: 'about', t: 'What is dHUB?', group: 'Getting started',
      q: ['what is this', 'what is dhub', 'what can i do here', 'que es esto', 'que es dhub', 'para que sirve', 'overview', 'introduction'],
      a: ['dHUB is a set of small tools for a chemical-biology lab: plate analysis and dose-response fitting, plate and gel design, sequence and protein utilities, and reference protocols with calculators.',
          'Each tool is a self-contained page that runs in your browser. Pick a card on the home page to open one.'],
      see: ['apps', 'back-home', 'data-safety'] },
    { id: 'apps', t: 'Which tools can I use?', group: 'Getting started',
      q: ['list of apps', 'list of tools', 'what apps are there', 'which apps', 'available tools', 'que apps hay', 'que herramientas hay', 'lista de apps', 'apps disponibles'],
      a: function(ctx){
        var K = window.ASSIST.kbs, names = [];
        Object.keys(K).forEach(function(id){
          if (id === 'hub' || !ctx.can(id)) return;
          names.push('[[' + id + ':about|' + K[id].name + ']]');
        });
        return names.length ? ['You can open: ' + names.join(', ') + '.', 'Tap a name for what it does.'] : 'The tools appear on the home page as cards.';
      },
      see: ['unlock', 'about'] },
    { id: 'unlock', t: 'Getting more tools', group: 'Getting started', on: ['visitor'],
      q: ['code word', 'unlock', 'discover', 'enter code', 'secret code', 'hidden apps', 'codigo', 'palabra clave', 'desbloquear', 'mas apps', 'more apps', 'more tools', 'i dont see', 'no veo'],
      a: ['Some tools are shared by invitation. If someone gave you a code word, type it into the **discover** box on the home page and press Enter. Each word opens one tool.',
          'There is no account to create.'],
      show: { sel: '#hub-unlock-input', say: 'Type the code word here.' } },
    { id: 'help', t: 'What can this assistant do?', group: 'Getting started',
      q: ['what can you do', 'who are you', 'are you ai', 'are you a bot', 'como funciona esta ayuda', 'que puedes hacer', 'eres una ia', 'how does help work'],
      a: ['I answer how-to questions about dHUB and about the tool you have open, from notes written for each screen. I am not connected to an AI, and I never read or change your data.',
          'When I can, I point at the real button (**Show me**) or open the right screen. If I do not know, I say so.'],
      tip: 'Two or three plain words work best: “export results”, “add controls”, “dark mode”.' },
    { id: 'data-safety', t: 'Where is my data?', group: 'Your data',
      q: ['where is my data stored', 'is my data saved', 'is it private', 'lose my work', 'data lost', 'saved automatically', 'donde se guardan mis datos', 'se guarda', 'perder datos', 'privacidad', 'privacy', 'account', 'cuenta'],
      a: ['Everything you type or import stays in this browser, on this device. Nothing is uploaded, and visitors do not need an account.',
          'That also means it is gone if you clear the site’s data, use a private window, or open dHUB on another device.'],
      tip: 'Before clearing anything, export what matters: most tools have an export or save button for their results.' },
    { id: 'offline', t: 'Does it work offline?', group: 'Your data',
      q: ['offline', 'no internet', 'without connection', 'no wifi', 'sin internet', 'sin conexion', 'sin wifi', 'funciona offline'],
      a: ['Once the page has loaded, the tools are self-contained and most keep working without a connection.',
          'A few features load a library online when you use them, such as PDF export in Echo Dose Response and the structure drawings in Echo Dose Response, Dora and Ribbon.'] },
    { id: 'back-home', t: 'Getting back to the home page', group: 'Getting around',
      q: ['go back', 'back to home', 'home', 'leave app', 'close app', 'exit', 'volver', 'volver al inicio', 'salir', 'cerrar app', 'inicio'],
      a: 'Click the **d** at the top left. Inside a tool it takes you back to the home page.',
      show: { sel: '#hub-logo', say: 'This takes you back.' } },
    { id: 'search', t: 'Search everything', group: 'Getting around',
      q: ['search', 'find something', 'find an app', 'spotlight', 'cmd k', 'ctrl k', 'buscar', 'buscador', 'encontrar', 'busqueda'],
      a: function(ctx){
        return ['Press `⌘K` (or `Ctrl+K`), or click the magnifier at the top, and type. It tolerates typos and finds tools by what they do.']
          .concat(ctx.admin ? ['Signed in, it also searches your notebook: experiments, protocol steps, notes, plate maps and cultures.'] : []);
      },
      show: { sel: '#hub-search-btn', say: 'Click here, or press ⌘K.' } },
    { id: 'theme', t: 'Dark mode', group: 'Getting around',
      q: ['dark mode', 'light mode', 'theme', 'change theme', 'night mode', 'modo oscuro', 'tema', 'cambiar tema', 'modo claro'],
      steps: ['Click the gear at the top right.', 'Open **Appearance** and switch the theme.'],
      show: { sel: '#opts-btn', say: 'Settings are behind the gear.' },
      go: [{ l: 'Open settings', hub: 'openSettings' }] },
    { id: 'phone', t: 'Using it on a phone', group: 'Getting around',
      q: ['phone', 'mobile', 'iphone', 'android', 'tablet', 'small screen', 'movil', 'telefono', 'pantalla pequena', 'rotate', 'landscape', 'girar', 'horizontal', 'turn sideways'],
      a: 'Every tool is laid out for a phone. A few screens, such as a 384-well plate, do not fit upright: they ask you to turn the phone sideways instead of showing half a plate.' },
    { id: 'downloads', t: 'A download or export did nothing', group: 'Troubleshooting',
      q: ['download not working', 'export does nothing', 'file not downloading', 'pop up blocked', 'no descarga', 'no se descarga', 'exportar no funciona', 'bloqueado', 'blocked'],
      steps: ['Look in your browser’s download bar or Downloads folder; the file may already be there.',
              'Allow pop-ups and multiple downloads for this site, then try again.',
              'If it still fails, reload the page and repeat the export once.'],
      tip: 'A private window or a strict content blocker can also stop downloads.' },
    { id: 'signin', t: 'Do I need to sign in?', group: 'Your data',
      q: ['sign in', 'log in', 'login', 'account', 'create account', 'password', 'iniciar sesion', 'entrar', 'contrasena', 'registrarse'],
      a: 'No. Sign-in is only for the lab’s admin: it switches on the private notebook and syncs it to that account. Every public tool works without it.' },
    { id: 'workspace', t: 'The rail: Planner, Journal and the rest', group: 'Signed in', admin: true, on: ['ws-planner', 'ws-analysis', 'ws-archive', 'ws-cells', 'ws-more'],
      q: ['rail', 'sidebar', 'menu', 'planner', 'journal', 'visualize', 'designer', 'workspaces', 'barra lateral', 'menu lateral'],
      a: ['Signed in, the rail down the left names the workspaces: **Planner**, **Journal**, **Visualize** and **Designer** (all Labbook), then **Data Analysis**, **Archive**, **Cells** and **More apps**.',
          'On a phone it becomes the tab bar along the bottom.'],
      show: { sel: '#ws-rail', say: 'The workspaces.' } },
    { id: 'sync', t: 'Is it on my other computer?', group: 'Signed in', admin: true,
      q: ['sync', 'other computer', 'other device', 'not syncing', 'cloud', 'firebase', 'sincronizar', 'otro ordenador', 'otro dispositivo', 'nube', 'no sincroniza', 'local file'],
      a: 'Sync only works when dHUB is opened from its web address. A copy opened as a local file cannot sign in, so it keeps everything on that one machine.',
      steps: ['Open dHUB at the same web address on every device.', 'Sign in from the gear → Settings.', 'Check Settings → **Data**: it says whether you are syncing and, if not, why.'],
      show: { sel: '#opts-btn', say: 'Settings → Data shows the sync state.' },
      go: [{ l: 'Open settings', hub: 'openSettings' }] }
  ]
});
