import './styles/globals.css';

const mode = localStorage.getItem('theme-mode');
if (mode) document.documentElement.classList.toggle('dark', mode === 'dark');
