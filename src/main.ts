import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { configureBrowserDateFormat } from './utils/dateUtils';
import '../index.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Configura formato brasileiro para inputs de data
configureBrowserDateFormat();

app.mount('#app'); 