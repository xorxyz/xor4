<template>
  <nav class="bg-darkest w-100 flex h3 justify-center items-center mb0">
    <div class="w-100 h-100 flex items-center justify-between pv0 ph4">
      <div class="flex items-center justify-center h-100">
        <router-link
          to="/"
          class="link">
          <!-- <Emoji class="icon f2">🏰</Emoji> -->
          <img src="/kernelquest-horizontal-white.svg" class="h2 pt2"/>
        </router-link>
      </div>
      <div class="flex justify-between items-center h-100 pt1">
        <div class="h-100 flex items-center mh4 f6">
          <!-- <router-link
            to="/game"
            active-class="is-selected"
            class="tab link grow mh2 ph2 pv2 white pointer">
            <Emoji class="f5">🧙</Emoji> Game
          </router-link> -->
          <!-- <router-link
            to="/levels"
            active-class="is-selected"
            class="tab link grow mh2 ph2 pv2 white pointer">
            <Emoji class="f5">🚩</Emoji> Levels
          </router-link> -->
          <!-- <router-link
            to="/editor"
            active-class="is-selected"
            class="tab link grow mh2 ph2 pv2 white pointer">
            <Emoji class="f5">🗺️</Emoji> Editor
          </router-link> -->
        </div>
      </div>
      <div class="flex items-center ">
        <div class="flex mh3">
          <div class="flex w3 items-center justify-center">
            <!-- <Emoji>👑</Emoji> <span class="mh2">0</span> -->
          </div>
          <div class="flex w3 items-center justify-center">
            <!-- <Emoji>💀</Emoji> <span class="mh2">0</span> -->
          </div>
        </div>
        <div class="mv0 pv0 flex-auto tr flex flex-row justify-end items-center h-100 ">
          <div class="pv0 flex h-100 items-center">
            <button
              @click="openMenu"
              id="menu-button"
              class="mv0 pv0 pointer link avatar is-empty grow w2 h2 dib br-pill ba bw1 b--border">
            </button>

            <div id="user-menu-dropdown" class="absolute right-0 top-2 mt4 mh2" v-if="isOpen">
              <div class="mt2 ph2 absolute top-3 right-0 bg-white black br3 shadow flex flex-column w5 pv2 z-5">
                <div>
                  <div class="br3 ma1 black pv2 ph2 flex flex-row items-center">
                    <span></span>
                    <span class="mh2">{{ user?.email }}</span>
                  </div>
                </div>
                <div>
                  <div @click="logout" class="pointer br3 ma1 black hover-bg-light-gray pv2 ph2 flex flex-row items-center">
                    <span>⇥</span>
                    <span class="mh2">Log Out</span>
                  </div>
                </div>
              </div>
              <div class="modal-bg z-4 fixed top-0 left-0 w-100 h-100 bg-black-40 mt0 pointer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue';
  import { onBeforeUnmount, onMounted, ref } from 'vue';

  export default {
    setup() {
      const { user, logout } = useAuth0();
      const isOpen = ref(false);

      const closeMenu = (event: any) => {
        if (isOpen.value && event.target?.id !== 'menu-button') {
          isOpen.value = false;
        }
      };

      onMounted(() => {
        window.addEventListener('click', closeMenu);
      });

      onBeforeUnmount(() => {
        window.removeEventListener('click', closeMenu);
      });

      return {
        user,
        isOpen: isOpen,
        openMenu() {
          isOpen.value = true;
        },
        logout: () => {
          logout({ logoutParams: { returnTo: window.location.origin } });
        }
      };
    }
  };
</script>
