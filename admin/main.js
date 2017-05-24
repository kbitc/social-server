var Vue = require('vue');
var VueRouter = require('vue-router');

// Vue single file components
var Welcome = require('./components/welcome.vue');
var Dashboard = require('./components/dashboard.vue');
var Markers = require('./components/markers.vue');
var Resources = require('./components/resources.vue');

Vue.use(VueRouter);

const router = new VueRouter({
    routes: [
        { path: '/', component: Welcome },
        { path: '/dashboard', component: Dashboard },
        { path: '/markers', component: Markers },
        { path: '/resources', component: Resources }
    ],
    linkActiveClass: "active"
});

var vue = new Vue({
    router: router
}).$mount('#content');