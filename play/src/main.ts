import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createAuth0 } from "@auth0/auth0-vue"

import App from './App.vue'
import router from './router'

const app = createApp(App)
const redirectUri = `${window.location.protocol}//${window.location.host}/callback`

console.log(redirectUri)

app.use(createPinia())
app.use(router)

app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      redirect_uri: redirectUri,
    },
  })
)

app.mount('#app')
