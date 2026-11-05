import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import { clearStoredSession } from './shared/lib/session';
import './assets/tailwind.css';

// Discard any session left over from a previous launch before the router runs,
// so every app start forces a fresh login.
clearStoredSession();

createApp(App).use(createPinia()).use(router).use(VueQueryPlugin).mount('#app');
