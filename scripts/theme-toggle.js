// Theme toggle functionality
const toggleIcon = document.getElementById('themeIcon');

// Check for saved theme preference or use system preference
export function checkThemePreference() {
    if (localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark');
        toggleIcon.classList.remove('fa-moon');
        toggleIcon.classList.add('fa-sun');
    } else {
        document.body.classList.remove('dark');
        toggleIcon.classList.remove('fa-sun');
        toggleIcon.classList.add('fa-moon');
    }
}

// Toggle theme
export function toggleTheme() {
    if (document.body.classList.contains('dark')) {
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        toggleIcon.classList.remove('fa-sun');
        toggleIcon.classList.add('fa-moon');
    } else {
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        toggleIcon.classList.remove('fa-moon');
        toggleIcon.classList.add('fa-sun');
    }
}