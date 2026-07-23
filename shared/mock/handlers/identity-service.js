window.BANCA = window.BANCA || {};
BANCA.current = () => localStorage.getItem('bancaPersona') || 'RM-01';
BANCA.setPersona = p => { localStorage.setItem('bancaPersona', p); location.reload(); };
BANCA.persona = () => BANCA.personas[BANCA.current()];
